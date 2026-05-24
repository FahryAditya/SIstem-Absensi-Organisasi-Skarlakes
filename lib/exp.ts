import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher-server'

// ============================================================
// Level thresholds — EXP minimum untuk masuk level tsb
// ============================================================
export const LEVEL_THRESHOLDS = [0, 150, 350, 600, 900] as const

export const LEVEL_NAMES: Record<number, string> = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
  4: 'Expert',
  5: 'Master',
}

// EXP yang dibutuhkan PER level (jarak antar threshold)
export const EXP_PER_LEVEL = [150, 200, 250, 300] // Lv1→2, Lv2→3, Lv3→4, Lv4→5

/**
 * Hitung level dari total EXP.
 * Lv1: 0-149 | Lv2: 150-349 | Lv3: 350-599 | Lv4: 600-899 | Lv5: 900+
 */
export function calculateLevel(xp: number): number {
  if (xp >= 900) return 5
  if (xp >= 600) return 4
  if (xp >= 350) return 3
  if (xp >= 150) return 2
  return 1
}

/**
 * Hitung progress bar EXP menuju level berikutnya.
 * Return: { expSaatIni, expUntukLevel, persen, levelName, nextLevelName }
 */
export function calculateProgress(xp: number, level: number) {
  if (level >= 5) {
    return {
      expSaatIni: xp - LEVEL_THRESHOLDS[4],
      expUntukLevel: null,
      persen: 100,
      levelName: LEVEL_NAMES[5],
      nextLevelName: null,
    }
  }
  const startExp = LEVEL_THRESHOLDS[level - 1]
  const endExp = LEVEL_THRESHOLDS[level]
  const expSaatIni = xp - startExp
  const expUntukLevel = endExp - startExp
  const persen = Math.min(100, Math.round((expSaatIni / expUntukLevel) * 100))
  return {
    expSaatIni,
    expUntukLevel,
    persen,
    levelName: LEVEL_NAMES[level],
    nextLevelName: LEVEL_NAMES[level + 1] ?? null,
  }
}

// ============================================================
// updateExp() — WAJIB dipakai semua perubahan EXP
// ============================================================

type TipeAnggota = 'siswa' | 'anggota_osis' | 'anggota_mpk'

interface UpdateExpParams {
  tipeAnggota: TipeAnggota
  targetId: number
  selisih: number
  alasan: string
  adminId: number
  organisasi: string
  tx?: Prisma.TransactionClient
}

interface UpdateExpResult {
  xpBaru: number
  levelBaru: number
  levelNaik: boolean
  levelLama: number
}

export async function updateExp({
  tipeAnggota,
  targetId,
  selisih,
  alasan,
  adminId,
  organisasi,
  tx,
}: UpdateExpParams): Promise<UpdateExpResult> {
  const run = async (client: Prisma.TransactionClient): Promise<UpdateExpResult> => {
    let xpLama = 0
    let levelLama = 1
    let namaAnggota = ''
    let emailAnggota: string | null = null

    // 1. Ambil data anggota & XP lama
    if (tipeAnggota === 'siswa') {
      const siswa = await client.siswa.findUniqueOrThrow({ where: { id: targetId } })
      xpLama = siswa.xp
      levelLama = siswa.level
      namaAnggota = siswa.nama
      emailAnggota = siswa.email
    } else if (tipeAnggota === 'anggota_osis') {
      const anggota = await client.anggotaOsis.findUniqueOrThrow({ where: { id: targetId } })
      xpLama = anggota.xp
      levelLama = anggota.level
      namaAnggota = anggota.nama
      emailAnggota = anggota.email
    } else {
      const anggota = await client.anggotaMpk.findUniqueOrThrow({ where: { id: targetId } })
      xpLama = anggota.xp
      levelLama = anggota.level
      namaAnggota = anggota.nama
      emailAnggota = anggota.email
    }

    // 2. Hitung XP baru (tidak boleh di bawah 0)
    const xpBaru = Math.max(0, xpLama + selisih)
    const levelBaru = calculateLevel(xpBaru)
    const levelNaik = levelBaru > levelLama

    // 3. Update ke tabel yang sesuai
    if (tipeAnggota === 'siswa') {
      await client.siswa.update({
        where: { id: targetId },
        data: { xp: xpBaru, level: levelBaru },
      })
    } else if (tipeAnggota === 'anggota_osis') {
      await client.anggotaOsis.update({
        where: { id: targetId },
        data: { xp: xpBaru, level: levelBaru },
      })
    } else {
      await client.anggotaMpk.update({
        where: { id: targetId },
        data: { xp: xpBaru, level: levelBaru },
      })
    }

    // 4. Catat di exp_log
    await client.expLog.create({
      data: {
        tipe_anggota: tipeAnggota,
        siswa_id: tipeAnggota === 'siswa' ? targetId : null,
        anggota_osis_id: tipeAnggota === 'anggota_osis' ? targetId : null,
        anggota_mpk_id: tipeAnggota === 'anggota_mpk' ? targetId : null,
        admin_id: adminId,
        exp_sebelum: xpLama,
        exp_sesudah: xpBaru,
        selisih,
        alasan,
        organisasi,
      },
    })

    const result = { xpBaru, levelBaru, levelNaik, levelLama }
    if (levelNaik) {
      await sendLevelUpNotification({
        nama: namaAnggota,
        email: emailAnggota,
        levelLama,
        levelBaru,
        organisasi,
        alasan,
      })
    }

    if (pusherServer) {
      try {
        await pusherServer.trigger('leaderboard', 'xp-updated', {
          tipeAnggota,
          targetId,
          organisasi,
          xp: xpBaru,
          level: levelBaru,
        })
      } catch (error) {
        console.error('[LEADERBOARD PUSHER ERROR]', error)
      }
    }

    return result
  }

  if (tx) return run(tx)
  return await prisma.$transaction(run)
}

async function sendLevelUpNotification(params: {
  nama: string
  email?: string | null
  levelLama: number
  levelBaru: number
  organisasi: string
  alasan: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  const to = params.email || process.env.LEVEL_UP_NOTIFICATION_EMAIL
  if (!apiKey || !to) return

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'SKARLAKE ARTEMIS <noreply@skarlake.sch.id>',
        to: [to],
        subject: `Level Up: ${params.nama} naik ke Lv ${params.levelBaru}`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
            <h2>Level Up ARTEMIS</h2>
            <p><strong>${params.nama}</strong> naik dari Lv ${params.levelLama} ke Lv ${params.levelBaru}.</p>
            <p>Organisasi: <strong>${params.organisasi.toUpperCase()}</strong></p>
            <p>Alasan EXP: ${params.alasan}</p>
          </div>
        `,
      }),
    })
  } catch (error) {
    console.error('[LEVEL UP EMAIL ERROR]', error)
  }
}
