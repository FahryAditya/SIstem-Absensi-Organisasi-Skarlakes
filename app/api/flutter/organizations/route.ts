import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jwtVerify } from 'jose'

async function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

  try {
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}

// GET - List organizations
export async function GET(req: NextRequest) {
  try {
    const payload = await verifyToken(req)
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}

    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        orderBy: { nama: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          nama: true,
          slug: true,
          deskripsi: true,
          logo: true,
          _count: {
            select: {
              members: true,
            }
          }
        }
      }),
      prisma.organization.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Data berhasil diambil',
      data: organizations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    })

  } catch (error) {
    console.error('GET organizations error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' }, 
      { status: 500 }
    )
  }
}
