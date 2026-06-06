import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessibleOrgs } from '@/lib/auth-shared'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = getCtx(req)
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // 'eskul' or 'osis-mpk'
    const status = searchParams.get('status')
    const orgId = searchParams.get('orgId')

    const accessibleOrgs = getAccessibleOrgs(ctx.userRole)

    if (!accessibleOrgs || accessibleOrgs.length === 0) {
      console.warn('[ADMIN REGISTRATION LIST] No accessible orgs for role:', ctx.userRole)
      return NextResponse.json([])
    }

    if (type === 'eskul') {
      const data = await prisma.registrationEskul.findMany({
        where: {
          ...(status ? { status: status as any } : {}),
          ...(orgId ? { organization_id: parseInt(orgId) } : {}),
          organization: {
            tipe: { in: accessibleOrgs as any }
          }
        },
        include: { organization: true },
        orderBy: { created_at: 'desc' }
      })
      return NextResponse.json(data)
    } else if (type === 'osis-mpk') {
      const data = await prisma.registrationOsisMpk.findMany({
        where: {
          ...(status ? { status: status as any } : {}),
          ...(orgId ? { organization_id: parseInt(orgId) } : {}),
          organization: {
            tipe: { in: accessibleOrgs as any }
          }
        },
        include: { organization: true },
        orderBy: { created_at: 'desc' }
      })
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Tipe tidak valid' }, { status: 400 })
  } catch (error: any) {
    console.error('[ADMIN REGISTRATION LIST ERROR]', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
