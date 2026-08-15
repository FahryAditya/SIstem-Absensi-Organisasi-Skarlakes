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
    const sesiId = searchParams.get('sesiId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!sesiId) {
      return NextResponse.json(
        { success: false, message: 'Sesi ID wajib diisi' },
        { status: 400 }
      )
    }

    const messages = await prisma.chatWawancara.findMany({
      where: { sesi_id: parseInt(sesiId) },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
      include: {
        sender: {
          select: {
            id: true,
            nama: true,
            email: true,
            role: true,
          }
        }
      }
    })

    const total = await prisma.chatWawancara.count({
      where: { sesi_id: parseInt(sesiId) }
    })

    return NextResponse.json({
      success: true,
      data: {
        messages: messages.map(msg => ({
          id: msg.id,
          pesan: msg.pesan,
          sender: msg.sender,
          createdAt: msg.created_at,
        })),
        total,
        limit,
        offset,
        hasMore: (offset + limit) < total,
      }
    })

  } catch (error) {
    console.error('List messages error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
