import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessibleOrgs } from '@/lib/auth-shared'

export const dynamic = 'force-dynamic'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: (req.headers.get('x-user-role') || '').trim(),
  }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = getCtx(req)
    if (!ctx.userId || !ctx.userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accessible = getAccessibleOrgs(ctx.userRole)
    if (accessible.length === 0) {
      return NextResponse.json({ error: 'Forbidden: Anda tidak memiliki akses admin' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const organisasi = searchParams.get('organisasi')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)

    if (!organisasi) {
      return NextResponse.json({ error: 'Parameter organisasi diperlukan' }, { status: 400 })
    }

    const orgLower = organisasi.toLowerCase() as 'programming' | 'english' | 'osis' | 'mpk'
    if (!accessible.includes(orgLower)) {
      return NextResponse.json({ error: 'Akses ditolak: Anda tidak mengelola organisasi ini' }, { status: 403 })
    }

    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where: { organizationType: orgLower as any },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          admin: {
            select: { nama: true, email: true },
          },
        },
      }),
      prisma.emailLog.count({
        where: { organizationType: orgLower as any },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Get email logs API error:', error)
    return NextResponse.json({ error: 'Gagal mengambil log email: ' + error.message }, { status: 500 })
  }
}
