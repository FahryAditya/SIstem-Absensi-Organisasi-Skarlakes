import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { getAccessibleOrgs } from '@/lib/auth-shared'
import { pusherServer } from '@/lib/pusher-server'
import { updateExp } from '@/lib/exp'
import { z } from 'zod'

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
  const tanggal = searchParams.get('tanggal')
  const ekskul = searchParams.get('ekskul') as 'programming' | 'english' | null
  const mode = searchParams.get('mode')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '100')

  // Build accessible ekskul filter
  const accessible = getAccessibleOrgs(userRole)

  let ekskulFilter = accessible
  if (ekskul && accessible.includes(ekskul)) ekskulFilter = [ekskul]

  // Optimized Input Mode: Combined Siswa + Absensi data
  if (mode === 'input' && tanggal && ekskul && accessible.includes(ekskul)) {
    const [siswaList, existingAbsensi] = await Promise.all([
      prisma.siswa.findMany({
        where: { ekskul: ekskul as any },
        select: { id: true, nama: true, kelas: true, ekskul: true },
        orderBy: { nama: 'asc' }
      }),
      prisma.absensi.findMany({
        where: {
          tanggal: new Date(tanggal),
          siswa: { ekskul: ekskul as any }
        },
        select: { siswa_id: true, status: true, uang_kas: true, keterangan: true }
      })
    ])

    const absMap = Object.fromEntries(
      existingAbsensi.map((a: { siswa_id: number; status: string; uang_kas: number; keterangan: string | null }) => [
        a.siswa_id,
        a
      ])
    )
    const rows = siswaList.map((s: { id: number; nama: string; kelas: string | null; ekskul: string }) => ({
      siswa_id: s.id,
      nama: s.nama,
      kelas: s.kelas,
      ekskul: s.ekskul,
      status: absMap[s.id]?.status || 'hadir',
      uang_kas: absMap[s.id]?.uang_kas || 0,
      keterangan: absMap[s.id]?.keterangan || '',
    }))

    return NextResponse.json({ data: rows })
  }

  const where: Record<string, unknown> = {
    siswa: { ekskul: { in: ekskulFilter } },
    ...(tanggal ? { 
      tanggal: new Date(tanggal)
    } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.absensi.findMany({
      where,
      include: { siswa: true, creator: { select: { id: true, nama: true } } },
      orderBy: [{ tanggal: 'desc' }, { siswa: { nama: 'asc' } }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.absensi.count({ where }),
  ])

  return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
}

// Bulk upsert absensi
const bulkSchema = z.object({
  tanggal: z.string(),
  rows: z.array(z.object({
    siswa_id: z.number(),
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

  const { tanggal, rows } = parsed.data
  const tanggalDate = new Date(tanggal)

  // Verify access for each siswa
  const siswaIds = rows.map(r => r.siswa_id)
  const siswaList = await prisma.siswa.findMany({
    where: { id: { in: siswaIds } },
    select: { id: true, nama: true, ekskul: true }
  })

  for (const s of siswaList) {
    const accessible = getAccessibleOrgs(ctx.userRole)
    if (!accessible.includes(s.ekskul))
      return NextResponse.json({ error: `Akses ditolak untuk ekskul ${s.ekskul}` }, { status: 403 })
  }

  // Fetch existing absensi to calculate XP differences
  const existingAbsensi = await prisma.absensi.findMany({
    where: {
      tanggal: tanggalDate,
      siswa_id: { in: siswaIds }
    },
    select: { siswa_id: true, status: true }
  })
  const existingMap = Object.fromEntries(
    existingAbsensi.map((a: { siswa_id: number; status: string }) => [a.siswa_id, a.status])
  )

  // Upsert absensi dan perubahan EXP dalam satu transaction.
  const results = await prisma.$transaction(async (tx) => {
    const saved = []

    for (const row of rows) {
      const prevStatus = existingMap[row.siswa_id]
      const xpDiff = hitungSelisihExpAbsensi(prevStatus, row.status)

      const upserted = await tx.absensi.upsert({
        where: { siswa_id_tanggal: { siswa_id: row.siswa_id, tanggal: tanggalDate } },
        update: { status: row.status, uang_kas: row.uang_kas, keterangan: row.keterangan, updated_by: ctx.userId },
        create: { siswa_id: row.siswa_id, tanggal: tanggalDate, status: row.status, uang_kas: row.uang_kas, keterangan: row.keterangan, created_by: ctx.userId },
      })

      // Update EXP via updateExp() (wajib lewat fungsi ini)
      if (xpDiff !== 0) {
        const siswa = siswaList.find((s: { id: number; ekskul: string }) => s.id === row.siswa_id)
        await updateExp({
          tipeAnggota: 'siswa',
          targetId: row.siswa_id,
          selisih: xpDiff,
          alasan: xpDiff > 0 ? 'Hadir ekskul' : 'Tidak hadir ekskul',
          adminId: ctx.userId,
          organisasi: siswa?.ekskul ?? 'programming',
          tx,
        })
      }

      // Streak bonus EXP (cek setelah hadir)
      if (row.status === 'hadir') {
        const riwayat = await tx.absensi.findMany({
          where: { siswa_id: row.siswa_id, status: 'hadir' },
          orderBy: { tanggal: 'desc' },
          take: 10,
        })
        const streak = riwayat.length
        const siswa = siswaList.find((s: { id: number; ekskul: string }) => s.id === row.siswa_id)
        if (streak === 3) {
          await updateExp({ tipeAnggota: 'siswa', targetId: row.siswa_id, selisih: 15, alasan: 'Streak hadir 3x berturut-turut', adminId: ctx.userId, organisasi: siswa?.ekskul ?? 'programming', tx })
        } else if (streak === 5) {
          await updateExp({ tipeAnggota: 'siswa', targetId: row.siswa_id, selisih: 30, alasan: 'Streak hadir 5x berturut-turut', adminId: ctx.userId, organisasi: siswa?.ekskul ?? 'programming', tx })
        }
      }

      saved.push(upserted)
    }

    return saved
  })

  // Log
  const siswaMap = Object.fromEntries(
    siswaList.map((s: { id: number; nama: string }) => [s.id, s.nama])
  )
  const summary = rows.map(r => `${siswaMap[r.siswa_id] || r.siswa_id}: ${r.status}`).join(', ')
  await createLog({
    userId: ctx.userId, userNama: ctx.userNama, aksi: 'UPDATE',
    tabel: 'absensi', deskripsi: `${ctx.userNama} menyimpan absensi tanggal ${tanggal} (${rows.length} siswa): ${summary}`,
    dataBaru: { tanggal, jumlah: rows.length },
    ipAddress: getIp(req),
  })

  if (pusherServer) {
    try {
      await pusherServer.trigger('absensi', 'absensi-updated', {
        tanggal,
        count: results.length,
        userNama: ctx.userNama,
      })
    } catch (err) {
      console.error('Failed to trigger Pusher absensi-updated:', err)
    }
  }

  return NextResponse.json({ success: true, count: results.length })
}

export async function PUT(req: NextRequest) {
  const ctx = getCtx(req)
  const body = await req.json()
  const { id, ...data } = body
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const existing = await prisma.absensi.findUnique({
    where: { id },
    include: { siswa: true }
  })
  if (!existing) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })

  const accessible = getAccessibleOrgs(ctx.userRole)
  if (!accessible.includes(existing.siswa.ekskul))
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const xpDiff = data.status
    ? hitungSelisihExpAbsensi(existing.status, data.status)
    : 0

  const updated = await prisma.$transaction(async (tx) => {
    const updatedAbsensi = await tx.absensi.update({
      where: { id },
      data: { ...data, updated_by: ctx.userId },
      include: { siswa: true }
    })

    if (xpDiff !== 0) {
      await updateExp({
        tipeAnggota: 'siswa',
        targetId: existing.siswa_id,
        selisih: xpDiff,
        alasan: xpDiff > 0 ? 'Hadir ekskul (koreksi)' : 'Tidak hadir ekskul (koreksi)',
        adminId: ctx.userId,
        organisasi: existing.siswa.ekskul,
        tx,
      })
    }

    return updatedAbsensi
  })

  await createLog({
    userId: ctx.userId, userNama: ctx.userNama, aksi: 'UPDATE',
    tabel: 'absensi', recordId: id,
    deskripsi: `${ctx.userNama} mengubah absensi "${existing.siswa.nama}" tanggal ${existing.tanggal.toISOString().split('T')[0]}`,
    dataLama: { status: existing.status, uang_kas: existing.uang_kas },
    dataBaru: { status: updated.status, uang_kas: updated.uang_kas },
    ipAddress: getIp(req),
  })

  if (pusherServer) {
    try {
      await pusherServer.trigger('absensi', 'absensi-updated', {
        tanggal: existing.tanggal.toISOString().split('T')[0],
        count: 1,
        siswaNama: existing.siswa.nama,
        status: updated.status,
        userNama: ctx.userNama,
      })
    } catch (err) {
      console.error('Failed to trigger Pusher absensi-updated:', err)
    }
  }

  return NextResponse.json({ data: updated })
}

function hitungSelisihExpAbsensi(statusLama: string | undefined, statusBaru: string) {
  const nilaiStatus = (status: string | undefined) => {
    if (status === 'hadir') return 10
    if (status === 'tidak_hadir') return -10
    return 0
  }

  return nilaiStatus(statusBaru) - nilaiStatus(statusLama)
}
