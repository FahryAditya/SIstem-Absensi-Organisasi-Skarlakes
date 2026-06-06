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
    const orgIdParam = searchParams.get('orgId')
    
    // Validate orgId
    const parsedOrgId = orgIdParam ? parseInt(orgIdParam) : null

    // Validate role and permissions
    if (!ctx.userRole) {
      console.warn('[ADMIN REGISTRATION LIST] Missing user role in headers')
      return NextResponse.json({ error: 'Unauthorized', message: 'User role missing' }, { status: 401 })
    }

    const accessibleOrgs = getAccessibleOrgs(ctx.userRole)

    if (!accessibleOrgs || accessibleOrgs.length === 0) {
      return NextResponse.json([])
    }

    // Database connection test
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (dbError: any) {
      console.error('[ADMIN REGISTRATION LIST] Database Connection Error:', dbError)
      return NextResponse.json({ 
        error: 'Database connection error', 
        message: 'Tidak dapat terhubung ke database' 
      }, { status: 500 })
    }

    // Common query builder
    const buildWhere = () => {
      const where: any = {
        organization: {
          tipe: { in: accessibleOrgs as any }
        }
      }
      if (status && status !== 'SEMUA') {
        where.status = status as any
      }
      if (parsedOrgId && !isNaN(parsedOrgId)) {
        where.organization_id = parsedOrgId
      }
      return where
    }

    if (type === 'eskul') {
      const data = await prisma.registrationEskul.findMany({
        where: buildWhere(),
        include: { organization: true },
        orderBy: { created_at: 'desc' }
      })
      return NextResponse.json(data)
    } else if (type === 'osis-mpk') {
      const data = await prisma.registrationOsisMpk.findMany({
        where: buildWhere(),
        include: { organization: true },
        orderBy: { created_at: 'desc' }
      })
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Tipe tidak valid' }, { status: 400 })
  } catch (error: any) {
    console.error('[ADMIN REGISTRATION LIST ERROR]', error)
    
    // Provide as much detail as possible for debugging
    let errorMessage = error.message || 'Unknown internal error'
    if (error.code) errorMessage = `[${error.code}] ${errorMessage}`
    
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
