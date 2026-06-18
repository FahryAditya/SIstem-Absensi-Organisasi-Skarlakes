import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { z } from 'zod'

function isSuperAdmin(role: string) {
  return role === 'SUPER_ADMIN' || role === 'administrator'
}

const querySchema = z.object({
  targetId: z.coerce.number().int().positive(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const parsed = querySchema.safeParse({
      targetId: searchParams.get('target_id') || searchParams.get('targetId'),
    })

    if (!parsed.success) {
      return NextResponse.json({ error: 'ID Anggota wajib diisi' }, { status: 400 })
    }

    const { targetId } = parsed.data

    const member = await prisma.member.findUnique({
      where: { id: targetId },
      select: { organization_id: true }
    })

    if (!member) return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 })

    // RBAC Check
    if (!isSuperAdmin(session.role as string) && !session.orgIds.includes(member.organization_id)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const data = await prisma.memberAchievement.findMany({
      where: { member_id: targetId },
      include: { achievement: true },
      orderBy: { earned_at: 'desc' },
    })

    // Map to old format for UI compatibility if needed
    const formatted = data.map(d => ({
      id: d.id,
      tanggal: d.earned_at,
      pencapaian: d.achievement
    }))

    return NextResponse.json({ data: formatted })
  } catch (error) {
    console.error('[PENCAPAIAN ANGGOTA ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
