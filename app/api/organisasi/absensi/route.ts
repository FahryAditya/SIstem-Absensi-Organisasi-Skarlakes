import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { canAccessOsis, canAccessMpk } from '@/lib/auth'
import { jsonWithPrivateCache } from '@/lib/api-cache'
import { withRetryTransaction } from '@/lib/db-transaction'
import { pusherServer } from '@/lib/pusher-server'
import { z } from 'zod'
import { getLevel, getLevelName } from '@/lib/gamification'
import { sendLevelUpEmail } from '@/lib/email'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

export async function GET(req: NextRequest) {
  const { userRole } = getCtx(req)
  const { searchParams } = new URL(req.url)
  const organisasi = searchParams.get('organisasi') as 'osis' | 'mpk' | null
  const tanggal = searchParams.get('tanggal')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

  if (organisasi === 'osis' && !canAccessOsis(userRole))
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  if (organisasi === 'mpk' && !canAccessMpk(userRole))
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const accessible: string[] = []
  if (canAccessOsis(userRole)) accessible.push('osis')
  if (canAccessMpk(userRole)) accessible.push('mpk')

  const orgFilter = organisasi && accessible.includes(organisasi) ? [organisasi] : accessible

  const where: Record<string, unknown> = {
    organisasi_type: { in: orgFilter },
    ...(tanggal ? { tanggal: new Date(tanggal) } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.absensiOrganisasi.findMany({
      where,
      include: { anggota_osis: true, anggota_mpk: true },
      orderBy: [{ tanggal: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.absensiOrganisasi.count({ where }),
  ])

  return jsonWithPrivateCache({ data, total, totalPages: Math.ceil(total / limit) })
}

const bulkSchema = z.object({
  organisasi: z.enum(['osis', 'mpk']),
  tanggal: z.string(),
  rows: z.array(z.object({
    anggota_id: z.number(),
    status: z.enum(['hadir', 'tidak_hadir', 'izin', 'sakit']),
    uang_kas: z.number().min(0).default(0),
    keterangan: z.string().nullable().optional(),
  }))
})

export async function POST(req: NextRequest) {
  const ctx = getCtx(req)
  const body = await req.json()
  const parsed = bulkSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { organisasi, tanggal, rows } = parsed.data

  if (organisasi === 'osis' && !canAccessOsis(ctx.userRole))
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  if (organisasi === 'mpk' && !canAccessMpk(ctx.userRole))
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const tanggalDate = new Date(tanggal)
  const anggotaKey = organisasi === 'osis' ? 'anggota_osis_id' : 'anggota_mpk_id'

  // ── Semua upsert dalam satu transaction dengan retry otomatis. ──────────
  // RepeatableRead memastikan dua admin yang submit bersamaan tidak akan
  // membaca snapshot stale dan menghasilkan INSERT ganda. Jika terjadi
  // konflik serialisasi, transaksi di-retry otomatis (maks 3x).
  await withRetryTransaction(async (tx) => {
    for (const row of rows) {
      const whereData: Record<string, unknown> = {
        [anggotaKey]: row.anggota_id,
        tanggal: tanggalDate,
      }

      const getXpValue = (status: string) => {
        if (status === 'hadir') return 10
        if (status === 'tidak_hadir') return -10
        return 0
      }

      // Cari record yang sudah ada dalam snapshot transaksi yang sama
      const existing = await tx.absensiOrganisasi.findFirst({ where: whereData })
      
      const prevStatus = existing?.status || null
      const xpDiff = getXpValue(row.status) - (prevStatus ? getXpValue(prevStatus) : 0)

      const baseData = {
        organisasi_type: organisasi,
        tanggal: tanggalDate,
        status: row.status,
        uang_kas: row.uang_kas,
        keterangan: row.keterangan,
      }

      if (existing) {
        // Record sudah ada — update langsung
        await tx.absensiOrganisasi.update({
          where: { id: existing.id },
          data: { ...baseData, updated_by: ctx.userId },
        })
      } else {
        // Record belum ada — coba create; jika admin lain create duluan
        // (P2002 dari DB unique constraint), fallback ke update.
        try {
          await tx.absensiOrganisasi.create({
            data: { ...baseData, [anggotaKey]: row.anggota_id, created_by: ctx.userId },
          })
        } catch (e: any) {
          if (e?.code === 'P2002') {
            // Tabrakan terdeteksi: ambil record yang baru saja dibuat oleh admin lain
            const concurrent = await tx.absensiOrganisasi.findFirst({ where: whereData })
            if (concurrent) {
              await tx.absensiOrganisasi.update({
                where: { id: concurrent.id },
                data: { ...baseData, updated_by: ctx.userId },
              })
            }
          } else {
            throw e
          }
        }
      }

      // Update XP for AnggotaOsis or AnggotaMpk dynamically
      if (xpDiff !== 0) {
        if (organisasi === 'osis') {
          const anggota = await tx.anggotaOsis.findUnique({ where: { id: row.anggota_id } })
          if (anggota) {
            const oldXp = anggota.xp
            const newXp = Math.max(0, oldXp + xpDiff)
            const oldLevel = getLevel(oldXp)
            const newLevel = getLevel(newXp)

            await tx.anggotaOsis.update({
              where: { id: row.anggota_id },
              data: { xp: newXp }
            })

            if (newLevel > oldLevel) {
              sendLevelUpEmail(anggota.nama, 'siswa@skarlakes.sch.id', newLevel, getLevelName(newLevel)).catch(console.error)
            }
          }
        } else {
          const anggota = await tx.anggotaMpk.findUnique({ where: { id: row.anggota_id } })
          if (anggota) {
            const oldXp = anggota.xp
            const newXp = Math.max(0, oldXp + xpDiff)
            const oldLevel = getLevel(oldXp)
            const newLevel = getLevel(newXp)

            await tx.anggotaMpk.update({
              where: { id: row.anggota_id },
              data: { xp: newXp }
            })

            if (newLevel > oldLevel) {
              sendLevelUpEmail(anggota.nama, 'siswa@skarlakes.sch.id', newLevel, getLevelName(newLevel)).catch(console.error)
            }
          }
        }
      }
    }
  })

  await createLog({
    userId: ctx.userId, userNama: ctx.userNama, aksi: 'UPDATE',
    tabel: `absensi_${organisasi}`,
    deskripsi: `${ctx.userNama} menyimpan absensi ${organisasi.toUpperCase()} tanggal ${tanggal} (${rows.length} anggota)`,
    dataBaru: { tanggal, organisasi, jumlah: rows.length },
    ipAddress: getIp(req),
  })

  if (pusherServer) {
    try {
      await pusherServer.trigger('absensi', 'absensi-updated', {
        organisasi,
        tanggal,
        count: rows.length,
        userNama: ctx.userNama,
      })
    } catch (err) {
      console.error('Failed to trigger Pusher absensi-updated for organisasi:', err)
    }
  }

  return NextResponse.json({ success: true, count: rows.length })
}
