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

// GET - Get single member by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyToken(req)
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'ID tidak valid' }, 
        { status: 400 }
      )
    }

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            nama: true,
            slug: true,
            deskripsi: true,
          }
        },
        attendances: {
          orderBy: { tanggal: 'desc' },
          take: 10,
          select: {
            id: true,
            tanggal: true,
            status: true,
            keterangan: true,
          }
        }
      }
    })

    if (!member) {
      return NextResponse.json(
        { success: false, message: 'Data tidak ditemukan' }, 
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Data berhasil diambil',
      data: member,
    })

  } catch (error) {
    console.error('GET member by ID error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' }, 
      { status: 500 }
    )
  }
}
