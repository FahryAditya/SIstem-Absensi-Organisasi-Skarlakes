import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher-server'

export const LEVEL_THRESHOLDS = [0, 150, 350, 600, 900] as const

export const LEVEL_NAMES: Record<number, string> = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
  4: 'Expert',
  5: 'Master',
}

export function calculateLevel(xp: number): number {
  if (xp >= 900) return 5
  if (xp >= 600) return 4
  if (xp >= 350) return 3
  if (xp >= 150) return 2
  return 1
}

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

interface UpdateExpParams {
  targetId: number
  selisih: number
  alasan: string
  adminId: number
  organizationId: number
  tx?: Prisma.TransactionClient
  tipeAnggota?: string // Kept for compatibility but we mostly use 'member' now
}

interface UpdateExpResult {
  xpBaru: number
  levelBaru: number
  levelNaik: boolean
  levelLama: number
}

export async function updateExp({
  targetId,
  selisih,
  alasan,
  adminId,
  organizationId,
  tx,
}: UpdateExpParams): Promise<UpdateExpResult> {
  const run = async (client: Prisma.TransactionClient): Promise<UpdateExpResult> => {
    // 1. Ambil data anggota & XP lama
    const member = await client.member.findUniqueOrThrow({ 
      where: { id: targetId } 
    })
    
    const xpLama = member.exp
    const levelLama = member.level

    // 2. Hitung XP baru
    const xpBaru = Math.max(0, xpLama + selisih)
    const levelBaru = calculateLevel(xpBaru)
    const levelNaik = levelBaru > levelLama

    // 3. Update member
    await client.member.update({
      where: { id: targetId },
      data: { exp: xpBaru, level: levelBaru },
    })

    // 4. Catat di exp_log
    await client.expLog.create({
      data: {
        member_id: targetId,
        organization_id: organizationId,
        admin_id: adminId,
        exp_before: xpLama,
        exp_after: xpBaru,
        amount: selisih,
        reason: alasan,
      },
    })

    const result = { xpBaru, levelBaru, levelNaik, levelLama }

    if (pusherServer) {
      try {
        await pusherServer.trigger('leaderboard', 'xp-updated', {
          memberId: targetId,
          organizationId,
          xp: xpBaru,
          level: levelBaru,
        })
      } catch (error) {}
    }

    return result
  }

  if (tx) return run(tx)
  return await prisma.$transaction(run)
}
