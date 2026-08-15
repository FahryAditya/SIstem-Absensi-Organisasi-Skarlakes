import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jwtVerify } from 'jose'
import Pusher from 'pusher'

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

// Initialize Pusher for real-time notifications
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
  useTLS: true,
})

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
    const { sesiId, pesan } = body

    if (!sesiId || !pesan || !pesan.trim()) {
      return NextResponse.json(
        { success: false, message: 'Sesi ID dan pesan wajib diisi' },
        { status: 400 }
      )
    }

    // Get sender info
    const sender = await prisma.user.findUnique({
      where: { id: payload.userId as number },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
      }
    })

    if (!sender) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if session exists
    const sesi = await prisma.sesiWawancara.findUnique({
      where: { id: sesiId },
      select: {
        id: true,
        status: true,
        organisasi_type: true,
      }
    })

    if (!sesi) {
      return NextResponse.json(
        { success: false, message: 'Sesi wawancara tidak ditemukan' },
        { status: 404 }
      )
    }

    // Save message to database
    const chat = await prisma.chatWawancara.create({
      data: {
        sesi_id: sesiId,
        sender_id: sender.id,
        pesan: pesan.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            nama: true,
            email: true,
            role: true,
          }
        },
        sesi: {
          select: {
            organisasi_type: true,
            status: true,
          }
        }
      }
    })

    // Send real-time notification via Pusher
    try {
      await pusher.trigger(`sesi-${sesiId}`, 'new-message', {
        id: chat.id,
        pesan: chat.pesan,
        sender: {
          id: chat.sender.id,
          nama: chat.sender.nama,
          role: chat.sender.role,
        },
        createdAt: chat.created_at,
        sesi: chat.sesi,
      })
    } catch (pusherError) {
      console.error('Pusher error:', pusherError)
      // Continue even if Pusher fails
    }

    return NextResponse.json({
      success: true,
      message: 'Pesan berhasil dikirim',
      data: {
        id: chat.id,
        pesan: chat.pesan,
        sender: chat.sender,
        sesi: chat.sesi,
        createdAt: chat.created_at,
      }
    })

  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
