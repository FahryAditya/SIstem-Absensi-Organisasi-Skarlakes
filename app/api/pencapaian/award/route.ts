import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { updateExp } from '@/lib/exp'
import {
  canAccessEnglish,
  canAccessMpk,
  canAccessOsis,
  canAccessProgramming,
} from '@/lib/auth'
import { z } from 'zod'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

const awardSchema = z.object({
  pencapaianId: z.number().int().positive(),
  memberId: z.number().int().positive(),
  tipe: z.enum(['ekskul', 'osis', 'mpk']),
})

export async function POST(req: NextRequest) {
  const ctx = getCtx(req)
  const body = await req.json()
  const parsed = awardSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { pencapaianId, memberId, tipe } = parsed.data

  try {
    const pencapaian = await prisma.pencapaian.findUnique({ where: { id: pencapaianId } })
    if (!pencapaian) {
      return NextResponse.json({ error: 'Pencapaian tidak ditemukan' }, { status: 404 })
    }

    if (pencapaian.organisasi === 'programming' && !canAccessProgramming(ctx.userRole)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }
    if (pencapaian.organisasi === 'english' && !canAccessEnglish(ctx.userRole)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }
    if (pencapaian.organisasi === 'osis' && !canAccessOsis(ctx.userRole)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }
    if (pencapaian.organisasi === 'mpk' && !canAccessMpk(ctx.userRole)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const tipeAnggota = tipe === 'ekskul'
      ? 'siswa'
      : tipe === 'osis'
        ? 'anggota_osis'
        : 'anggota_mpk'

    const result = await prisma.$transaction(async (tx) => {
      if (tipeAnggota === 'siswa') {
        const siswa = await tx.siswa.findUnique({ where: { id: memberId } })
        if (!siswa) throw new Error('Siswa tidak ditemukan')
        if (pencapaian.organisasi !== 'semua' && siswa.ekskul !== pencapaian.organisasi) {
          throw new Error('Pencapaian tidak sesuai organisasi siswa')
        }

        const alreadyAwarded = await tx.siswaPencapaian.findUnique({
          where: {
            pencapaian_id_siswa_id: { pencapaian_id: pencapaianId, siswa_id: memberId },
          },
        })
        if (alreadyAwarded) {
          throw new Error(`Siswa "${siswa.nama}" sudah memiliki pencapaian ini`)
        }

        await tx.siswaPencapaian.create({
          data: {
            pencapaian_id: pencapaianId,
            tipe_anggota: 'siswa',
            siswa_id: memberId,
          },
        })

        const expResult = await updateExp({
          tipeAnggota,
          targetId: memberId,
          selisih: pencapaian.exp_reward,
          alasan: `Pencapaian: ${pencapaian.nama}`,
          adminId: ctx.userId,
          organisasi: pencapaian.organisasi === 'semua' ? siswa.ekskul : pencapaian.organisasi,
          tx,
        })

        return { nama: siswa.nama, email: siswa.email, expResult }
      }

      if (tipeAnggota === 'anggota_osis') {
        const anggota = await tx.anggotaOsis.findUnique({ where: { id: memberId } })
        if (!anggota) throw new Error('Anggota OSIS tidak ditemukan')
        if (pencapaian.organisasi !== 'semua' && pencapaian.organisasi !== 'osis') {
          throw new Error('Pencapaian tidak sesuai organisasi OSIS')
        }

        const alreadyAwarded = await tx.siswaPencapaian.findUnique({
          where: {
            pencapaian_id_anggota_osis_id: {
              pencapaian_id: pencapaianId,
              anggota_osis_id: memberId,
            },
          },
        })
        if (alreadyAwarded) {
          throw new Error(`Anggota "${anggota.nama}" sudah memiliki pencapaian ini`)
        }

        await tx.siswaPencapaian.create({
          data: {
            pencapaian_id: pencapaianId,
            tipe_anggota: 'anggota_osis',
            anggota_osis_id: memberId,
          },
        })

        const expResult = await updateExp({
          tipeAnggota,
          targetId: memberId,
          selisih: pencapaian.exp_reward,
          alasan: `Pencapaian: ${pencapaian.nama}`,
          adminId: ctx.userId,
          organisasi: 'osis',
          tx,
        })

        return { nama: anggota.nama, email: anggota.email, expResult }
      }

      const anggota = await tx.anggotaMpk.findUnique({ where: { id: memberId } })
      if (!anggota) throw new Error('Anggota MPK tidak ditemukan')
      if (pencapaian.organisasi !== 'semua' && pencapaian.organisasi !== 'mpk') {
        throw new Error('Pencapaian tidak sesuai organisasi MPK')
      }

      const alreadyAwarded = await tx.siswaPencapaian.findUnique({
        where: {
          pencapaian_id_anggota_mpk_id: {
            pencapaian_id: pencapaianId,
            anggota_mpk_id: memberId,
          },
        },
      })
      if (alreadyAwarded) {
        throw new Error(`Anggota "${anggota.nama}" sudah memiliki pencapaian ini`)
      }

      await tx.siswaPencapaian.create({
        data: {
          pencapaian_id: pencapaianId,
          tipe_anggota: 'anggota_mpk',
          anggota_mpk_id: memberId,
        },
      })

      const expResult = await updateExp({
        tipeAnggota,
        targetId: memberId,
        selisih: pencapaian.exp_reward,
        alasan: `Pencapaian: ${pencapaian.nama}`,
        adminId: ctx.userId,
        organisasi: 'mpk',
        tx,
      })

      return { nama: anggota.nama, email: anggota.email, expResult }
    })

    await sendAchievementNotification({
      nama: result.nama,
      email: result.email,
      pencapaianNama: pencapaian.nama,
      expReward: pencapaian.exp_reward,
    })

    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'UPDATE',
      tabel: tipe === 'ekskul' ? 'siswa' : `anggota_${tipe}`,
      recordId: memberId,
      deskripsi: `${ctx.userNama} memberikan pencapaian "${pencapaian.nama}" ke "${result.nama}" (${tipe.toUpperCase()}) (+${pencapaian.exp_reward} EXP).`,
      dataLama: { level: result.expResult.levelLama },
      dataBaru: { xp: result.expResult.xpBaru, level: result.expResult.levelBaru },
      ipAddress: getIp(req),
    })

    return NextResponse.json({
      success: true,
      awardedTo: result.nama,
      xp: result.expResult.xpBaru,
      level: result.expResult.levelBaru,
      levelUp: result.expResult.levelNaik,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message.includes('sudah memiliki') ? 409 : message.includes('tidak ditemukan') ? 404 : 500
    console.error('[AWARD PENCAPAIAN ERROR]', error)
    return NextResponse.json({ error: 'Gagal memberikan pencapaian: ' + message }, { status })
  }
}

async function sendAchievementNotification(params: {
  nama: string
  email?: string | null
  pencapaianNama: string
  expReward: number
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !params.email) return

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
    console.error('[AWARD EMAIL ERROR]', error)
  }
}
