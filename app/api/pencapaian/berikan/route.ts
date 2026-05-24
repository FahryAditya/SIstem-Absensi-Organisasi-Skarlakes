import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { updateExp } from '@/lib/exp'
import { isAdministrator } from '@/lib/auth'
import { TxClient } from '@/lib/db-transaction'
import { z } from 'zod'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

const beriSchema = z.object({
  pencapaian_id: z.number().int().positive(),
  penerima: z.array(z.object({
    tipe_anggota: z.enum(['siswa', 'anggota_osis', 'anggota_mpk']),
    target_id: z.number().int().positive(),
  })).min(1, 'Minimal 1 penerima'),
  override_duplikat: z.boolean().default(false),
})

// POST: Berikan pencapaian ke satu atau banyak anggota
export async function POST(req: NextRequest) {
  const ctx = getCtx(req)
  if (!isAdministrator(ctx.userRole)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = beriSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const results: { target_id: number; tipe: string; status: string }[] = []
    const notifications: { nama: string; email: string; pencapaianNama: string; expReward: number }[] = []
    const { pencapaian_id, penerima, override_duplikat } = parsed.data

    const pencapaian = await prisma.$transaction(async (tx: TxClient) => {
      const item = await tx.pencapaian.findUnique({ where: { id: pencapaian_id } })
      if (!item) return null

      for (const p of penerima) {
        // Cek duplikat
        let duplikat = false
        if (p.tipe_anggota === 'siswa') {
          const existing = await tx.siswaPencapaian.findUnique({
            where: { pencapaian_id_siswa_id: { pencapaian_id, siswa_id: p.target_id } },
          })
          duplikat = !!existing
        } else if (p.tipe_anggota === 'anggota_osis') {
          const existing = await tx.siswaPencapaian.findUnique({
            where: { pencapaian_id_anggota_osis_id: { pencapaian_id, anggota_osis_id: p.target_id } },
          })
          duplikat = !!existing
        } else {
          const existing = await tx.siswaPencapaian.findUnique({
            where: { pencapaian_id_anggota_mpk_id: { pencapaian_id, anggota_mpk_id: p.target_id } },
          })
          duplikat = !!existing
        }

        if (duplikat && !override_duplikat) {
          results.push({ target_id: p.target_id, tipe: p.tipe_anggota, status: 'duplikat_dilewati' })
          continue
        }

        // Tentukan organisasi dari pencapaian
        const organisasi = item.organisasi

        // Berikan pencapaian (junction table)
        await tx.siswaPencapaian.upsert({
          where: p.tipe_anggota === 'siswa'
            ? { pencapaian_id_siswa_id: { pencapaian_id, siswa_id: p.target_id } }
            : p.tipe_anggota === 'anggota_osis'
              ? { pencapaian_id_anggota_osis_id: { pencapaian_id, anggota_osis_id: p.target_id } }
              : { pencapaian_id_anggota_mpk_id: { pencapaian_id, anggota_mpk_id: p.target_id } },
          update: { tanggal: new Date() },
          create: {
            pencapaian_id,
            tipe_anggota: p.tipe_anggota,
            siswa_id: p.tipe_anggota === 'siswa' ? p.target_id : null,
            anggota_osis_id: p.tipe_anggota === 'anggota_osis' ? p.target_id : null,
            anggota_mpk_id: p.tipe_anggota === 'anggota_mpk' ? p.target_id : null,
          },
        })

        // Update EXP via updateExp()
        await updateExp({
          tipeAnggota: p.tipe_anggota,
          targetId: p.target_id,
          selisih: item.exp_reward,
          alasan: `Pencapaian: ${item.nama}`,
          adminId: ctx.userId,
          organisasi,
          tx,
        })

        const kontak = p.tipe_anggota === 'siswa'
          ? await tx.siswa.findUnique({ where: { id: p.target_id }, select: { nama: true, email: true } })
          : p.tipe_anggota === 'anggota_osis'
            ? await tx.anggotaOsis.findUnique({ where: { id: p.target_id }, select: { nama: true, email: true } })
            : await tx.anggotaMpk.findUnique({ where: { id: p.target_id }, select: { nama: true, email: true } })
        if (kontak?.email) {
          notifications.push({
            nama: kontak.nama,
            email: kontak.email,
            pencapaianNama: item.nama,
            expReward: item.exp_reward,
          })
        }

        results.push({ target_id: p.target_id, tipe: p.tipe_anggota, status: 'berhasil' })
      }

      return item
    })

    if (!pencapaian) {
      return NextResponse.json({ error: 'Pencapaian tidak ditemukan' }, { status: 404 })
    }

    await Promise.all(notifications.map(sendAchievementNotification))

    await createLog({
      userId: ctx.userId, userNama: ctx.userNama, aksi: 'CREATE',
      tabel: 'siswa_pencapaian', recordId: pencapaian_id,
      deskripsi: `${ctx.userNama} memberikan pencapaian "${pencapaian.nama}" ke ${penerima.length} anggota`,
      dataBaru: { pencapaian_id, results },
      ipAddress: getIp(req),
    })

    return NextResponse.json({ success: true, results })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[PENCAPAIAN BERIKAN ERROR]', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// GET: Lihat penerima pencapaian tertentu
export async function GET(req: NextRequest) {
  const ctx = getCtx(req)
  if (!isAdministrator(ctx.userRole)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const pencapaian_id = searchParams.get('pencapaian_id')
  if (!pencapaian_id) return NextResponse.json({ error: 'pencapaian_id required' }, { status: 400 })

  const penerima = await prisma.siswaPencapaian.findMany({
    where: { pencapaian_id: parseInt(pencapaian_id) },
    include: {
      pencapaian: true,
      siswa: { select: { id: true, nama: true, kelas: true, ekskul: true } },
      anggota_osis: { select: { id: true, nama: true, kelas: true, jabatan: true } },
      anggota_mpk: { select: { id: true, nama: true, kelas: true, jabatan: true } },
    },
    orderBy: { tanggal: 'desc' },
  })

  return NextResponse.json({ data: penerima })
}

async function sendAchievementNotification(params: {
  nama: string
  email: string
  pencapaianNama: string
  expReward: number
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'SKARLAKE ARTEMIS <noreply@skarlake.sch.id>',
        to: [params.email],
        subject: `Pencapaian Baru: ${params.pencapaianNama}`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
            <h2>Pencapaian Baru ARTEMIS</h2>
            <p>Halo <strong>${params.nama}</strong>, kamu mendapat pencapaian <strong>${params.pencapaianNama}</strong>.</p>
            <p>Reward: <strong>+${params.expReward} EXP</strong></p>
          </div>
        `,
      }),
    })
  } catch (error) {
    console.error('[ACHIEVEMENT EMAIL ERROR]', error)
  }
}
