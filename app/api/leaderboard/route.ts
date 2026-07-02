import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { calculateProgress, LEVEL_NAMES } from '@/lib/exp'


export const dynamic = 'force-dynamic'

function isSuperAdmin(role: string) {
  return role === 'SUPER_ADMIN' || role === 'administrator' || role === 'admin_osis_mpk'
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const orgId = searchParams.get('orgId')
    const limit = parseInt(searchParams.get('limit') || '10')

    // If orgId is provided, use it. Otherwise use activeOrgId from session.
    let filterOrgId = orgId ? parseInt(orgId) : session.activeOrgId

    if (!filterOrgId && !isSuperAdmin(session.role as string)) {
      return NextResponse.json({ error: 'No active organization selected' }, { status: 400 })
    }

    // RBAC Check
    if (!isSuperAdmin(session.role as string) && filterOrgId && !session.orgIds.includes(filterOrgId)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const where = filterOrgId ? { organization_id: filterOrgId, status: 'ACTIVE' } : { status: 'ACTIVE' }

    const members = await prisma.member.findMany({
      where,
      select: { 
        id: true, 
        name: true, 
        class: true, 
        jabatan: true, 
        exp: true, 
        level: true,
        organization: { select: { nama: true } }
      },
      orderBy: [{ exp: 'desc' }, { name: 'asc' }],
      take: limit,
    })

    const withProgress = members.map((m, index) => ({
      id: m.id,
      nama: m.name,
      kelas: m.class,
      jabatan: m.jabatan,
      xp: m.exp,
      level: m.level,
      organization: m.organization.nama,
      rank: index + 1,
      levelName: LEVEL_NAMES[m.level] ?? 'Beginner',
      progress: calculateProgress(m.exp, m.level),
    }))

    return NextResponse.json({ data: withProgress })
  } catch (error) {
    console.error('[LEADERBOARD ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
