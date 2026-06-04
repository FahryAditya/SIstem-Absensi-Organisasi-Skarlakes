import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {
      deletedAt: null
    }

    if (organizationId) {
      where.organizationId = parseInt(organizationId)
    }

    if (type) {
      where.type = type as any
    }

    const [docs, total] = await Promise.all([
      prisma.documentation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          creator: {
            select: { id: true, nama: true }
          },
          organization: true
        }
      }),
      prisma.documentation.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: docs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('Get documentation error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
