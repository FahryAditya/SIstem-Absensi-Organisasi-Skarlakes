import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { getLevel } from '@/lib/gamification'
import { sendLevelUpEmail, sendAchievementEmail } from '@/lib/email'
import {
  canAccessProgramming,
  canAccessEnglish,
  canAccessOsis,
  canAccessMpk
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
  pencapaianId: z.number(),
  memberId: z.number(),
  tipe: z.enum(['ekskul', 'osis', 'mpk'])
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
    // 1. Fetch Achievement
    const pencapaian = await prisma.pencapaian.findUnique({
      where: { id: pencapaianId }
    })
    if (!pencapaian) {
      return NextResponse.json({ error: 'Pencapaian tidak ditemukan' }, { status: 404 })
    }

    // Auth verification based on achievement's organization
    const org = pencapaian.organisasi
    if (org === 'programming' && !canAccessProgramming(ctx.userRole)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }
    if (org === 'english' && !canAccessEnglish(ctx.userRole)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }
    if (org === 'osis' && !canAccessOsis(ctx.userRole)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }
    if (org === 'mpk' && !canAccessMpk(ctx.userRole)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    let awardedName = ''
    let awardedEmail = 'siswa@skarlakes.sch.id' // fallback
    let oldXp = 0
    let newXp = 0

    // 2. Perform award logic based on type
    if (tipe === 'ekskul') {
      const siswa = await prisma.siswa.findUnique({ where: { id: memberId } })
      if (!siswa) return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })

      // Check if already awarded
      const alreadyAwarded = await prisma.siswaPencapaian.findUnique({
        where: {
          siswa_id_pencapaian_id: { siswa_id: memberId, pencapaian_id: pencapaianId }
        }
      })
      if (alreadyAwarded) {
        return NextResponse.json({ error: `Siswa "${siswa.nama}" sudah memiliki pencapaian ini` }, { status: 409 })
      }

      awardedName = siswa.nama
      oldXp = siswa.xp
      newXp = oldXp + pencapaian.exp_reward

      // DB Transaction for atomicity
      await prisma.$transaction([
        prisma.siswaPencapaian.create({
          data: { siswa_id: memberId, pencapaian_id: pencapaianId }
        }),
        prisma.siswa.update({
          where: { id: memberId },
          data: { xp: { increment: pencapaian.exp_reward } }
        })
      ])
    } else if (tipe === 'osis') {
      const anggota = await prisma.anggotaOsis.findUnique({ where: { id: memberId } })
      if (!anggota) return NextResponse.json({ error: 'Anggota OSIS tidak ditemukan' }, { status: 404 })

      const alreadyAwarded = await prisma.osisPencapaian.findUnique({
        where: {
          anggota_osis_id_pencapaian_id: { anggota_osis_id: memberId, pencapaian_id: pencapaianId }
        }
      })
      if (alreadyAwarded) {
        return NextResponse.json({ error: `Anggota "${anggota.nama}" sudah memiliki pencapaian ini` }, { status: 409 })
      }

      awardedName = anggota.nama
      oldXp = anggota.xp
      newXp = oldXp + pencapaian.exp_reward

      await prisma.$transaction([
        prisma.osisPencapaian.create({
          data: { anggota_osis_id: memberId, pencapaian_id: pencapaianId }
        }),
        prisma.anggotaOsis.update({
          where: { id: memberId },
          data: { xp: { increment: pencapaian.exp_reward } }
        })
      ])
    } else if (tipe === 'mpk') {
      const anggota = await prisma.anggotaMpk.findUnique({ where: { id: memberId } })
      if (!anggota) return NextResponse.json({ error: 'Anggota MPK tidak ditemukan' }, { status: 404 })

      const alreadyAwarded = await prisma.mpkPencapaian.findUnique({
        where: {
          anggota_mpk_id_pencapaian_id: { anggota_mpk_id: memberId, pencapaian_id: pencapaianId }
        }
      })
      if (alreadyAwarded) {
        return NextResponse.json({ error: `Anggota "${anggota.nama}" sudah memiliki pencapaian ini` }, { status: 409 })
      }

      awardedName = anggota.nama
      oldXp = anggota.xp
      newXp = oldXp + pencapaian.exp_reward

      await prisma.$transaction([
        prisma.mpkPencapaian.create({
          data: { anggota_mpk_id: memberId, pencapaian_id: pencapaianId }
        }),
        prisma.anggotaMpk.update({
          where: { id: memberId },
          data: { xp: { increment: pencapaian.exp_reward } }
        })
      ])
    }

    // 3. Level up verification
    const oldLevel = getLevel(oldXp)
    const newLevel = getLevel(newXp)
    const levelUpTriggered = newLevel > oldLevel

    // Get the tier names
    const getLevelTierName = (lv: number) => {
      if (lv === 1) return 'Beginner'
      if (lv === 2) return 'Intermediate'
      if (lv === 3) return 'Advanced'
      if (lv === 4) return 'Expert'
      return 'Master'
    }

    // 4. Trigger Emails asynchronously without blocking response
    try {
      await sendAchievementEmail(
        awardedName,
        awardedEmail,
        pencapaian.nama_pencapaian,
        pencapaian.icon,
        pencapaian.deskripsi,
        pencapaian.exp_reward
      )
      if (levelUpTriggered) {
        await sendLevelUpEmail(awardedName, awardedEmail, newLevel, getLevelTierName(newLevel))
      }
    } catch (mailErr) {
      console.error('[AWARD EMAIL TRIGGER ERROR]', mailErr)
    }

    // Log the action
    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'UPDATE',
      tabel: tipe === 'ekskul' ? 'siswa' : `anggota_${tipe}`,
      recordId: memberId,
      deskripsi: `${ctx.userNama} memberikan pencapaian "${pencapaian.nama_pencapaian}" ke "${awardedName}" (${tipe.toUpperCase()}) (+${pencapaian.exp_reward} EXP). ${levelUpTriggered ? `LEVEL UP ke Level ${newLevel}! 🎉` : ''}`,
      dataLama: { xp: oldXp },
      dataBaru: { xp: newXp },
      ipAddress: getIp(req)
    })

    return NextResponse.json({
      success: true,
      awardedTo: awardedName,
      oldXp,
      newXp,
      oldLevel,
      newLevel,
      levelUp: levelUpTriggered
    })
  } catch (error: any) {
    console.error('[AWARD PENCAPAIAN ERROR]', error)
    return NextResponse.json({ error: 'Gagal memberikan pencapaian: ' + error.message }, { status: 500 })
  }
}
