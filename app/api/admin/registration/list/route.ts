import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function isSuperAdmin(role: string) {
  return role === 'SUPER_ADMIN' || role === 'administrator'
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const orgId = searchParams.get('orgId')
    
    // Determine filterOrgId
    const filterOrgId = orgId ? parseInt(orgId) : session.activeOrgId

    if (!filterOrgId && !isSuperAdmin(session.role as string)) {
      return NextResponse.json({ error: 'No active organization selected' }, { status: 400 })
    }

    // RBAC Check
    if (!isSuperAdmin(session.role as string) && filterOrgId && !session.orgIds.includes(filterOrgId)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const where: any = {
      ...(filterOrgId ? { organization_id: filterOrgId } : {})
    }
    
    if (status && status !== 'SEMUA') {
      where.status = status as any
    }

    const data = await prisma.registration.findMany({
      where,
      include: { organization: { select: { nama: true } } },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[ADMIN REGISTRATION LIST ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
