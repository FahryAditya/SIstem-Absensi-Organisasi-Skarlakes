import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jwtVerify } from 'jose'
import { z } from 'zod'

// Middleware to verify JWT
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

const memberSchema = z.object({
  nis: z.string().nullable().optional(),
  name: z.string().min(1, 'Nama wajib diisi'),
  class: z.string().nullable().optional(),
  email: z.string().email('Email tidak valid').nullable().optional(),
  jabatan: z.string().nullable().optional(),
  status: z.string().default('ACTIVE'),
  organization_id: z.number().int().positive('Organization ID wajib diisi'),
})

// GET - List members with pagination and filters
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
    const organizationId = searchParams.get('organization_id')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'ACTIVE'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: 'Organization ID required' }, 
        { status: 400 }
      )
    }

    const where: any = {
      organization_id: parseInt(organizationId),
      status,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nis: { contains: search, mode: 'insensitive' } },
        { class: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          organization: {
            select: {
              id: true,
              nama: true,
              slug: true,
            }
          }
        }
      }),
      prisma.member.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Data berhasil diambil',
      data: members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    })

  } catch (error) {
    console.error('GET members error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' }, 
      { status: 500 }
    )
  }
}

// POST - Create new member
export async function POST(req: NextRequest) {
  try {
    const payload = await verifyToken(req)
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = memberSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: parsed.error.errors[0].message 
        }, 
        { status: 400 }
      )
    }

    // Check for duplicates
    const existing = await prisma.member.findFirst({
      where: {
        organization_id: parsed.data.organization_id,
        name: { equals: parsed.data.name.trim(), mode: 'insensitive' },
      },
    })

    if (existing) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Anggota "${existing.name}" sudah terdaftar` 
        }, 
        { status: 409 }
      )
    }

    const member = await prisma.member.create({
      data: {
        ...parsed.data,
        name: parsed.data.name.trim(),
      },
      include: {
        organization: {
          select: {
            id: true,
            nama: true,
            slug: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Anggota berhasil ditambahkan',
      data: member,
    }, { status: 201 })

  } catch (error) {
    console.error('POST member error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' }, 
      { status: 500 }
    )
  }
}

// PUT - Update member
export async function PUT(req: NextRequest) {
  try {
    const payload = await verifyToken(req)
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const body = await req.json()
    const { id, ...rest } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID required' }, 
        { status: 400 }
      )
    }

    const existing = await prisma.member.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Data tidak ditemukan' }, 
        { status: 404 }
      )
    }

    const parsed = memberSchema.partial().safeParse(rest)
    if (!parsed.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: parsed.error.errors[0].message 
        }, 
        { status: 400 }
      )
    }

    const updated = await prisma.member.update({
      where: { id },
      data: {
        ...parsed.data,
        ...(parsed.data.name && { name: parsed.data.name.trim() }),
      },
      include: {
        organization: {
          select: {
            id: true,
            nama: true,
            slug: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Data berhasil diupdate',
      data: updated,
    })

  } catch (error) {
    console.error('PUT member error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' }, 
      { status: 500 }
    )
  }
}

// DELETE - Delete member
export async function DELETE(req: NextRequest) {
  try {
    const payload = await verifyToken(req)
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const idStr = searchParams.get('id')
    
    if (!idStr) {
      return NextResponse.json(
        { success: false, message: 'ID required' }, 
        { status: 400 }
      )
    }

    const id = parseInt(idStr)
    const existing = await prisma.member.findUnique({ where: { id } })
    
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Data tidak ditemukan' }, 
        { status: 404 }
      )
    }

    await prisma.member.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'Data berhasil dihapus',
      data: { id },
    })

  } catch (error) {
    console.error('DELETE member error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' }, 
      { status: 500 }
    )
  }
}
