import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

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

    const filterOrgId = orgId ? parseInt(orgId) : session.activeOrgId

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
      select: { id: true, name: true, class: true, jabatan: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      data: members.map(m => ({
        id: m.id,
        nama: m.name,
        kelas: m.class ? `${m.class}${m.jabatan ? ` (${m.jabatan})` : ''}` : (m.jabatan || '-')
      }))
    })
  } catch (e: any) {
    console.error('[KAS MEMBERS ERROR]', e)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
