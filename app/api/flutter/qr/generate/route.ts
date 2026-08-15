import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jwtVerify } from 'jose'
import crypto from 'crypto'

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

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const payload = await verifyToken(req)
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { sesiId, validHours = 24 } = body

    if (!sesiId) {
      return NextResponse.json(
        { success: false, message: 'Sesi ID wajib diisi' },
        { status: 400 }
      )
    }

    // Check if session exists
    const sesi = await prisma.sesiWawancara.findUnique({
      where: { id: sesiId }
    })

    if (!sesi) {
      return NextResponse.json(
        { success: false, message: 'Sesi wawancara tidak ditemukan' },
        { status: 404 }
      )
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex')
    const now = new Date()
    const validUntil = new Date(now.getTime() + validHours * 60 * 60 * 1000)

    // Create QR code record
    const qrCode = await prisma.qrWawancara.create({
      data: {
        token,
        aktif: true,
        valid_from: now,
        valid_until: validUntil,
        sesi_id: sesiId,
        created_by: payload.userId as number,
      },
      include: {
        sesi: {
          select: {
            status: true,
            organisasi_type: true,
            jadwal_mulai: true,
            jadwal_selesai: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'QR Code berhasil dibuat',
      data: {
        id: qrCode.id,
        token: qrCode.token,
        qrUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/scan/${qrCode.token}`,
        aktif: qrCode.aktif,
        validFrom: qrCode.valid_from,
        validUntil: qrCode.valid_until,
        sesi: qrCode.sesi,
      }
    })

  } catch (error) {
    console.error('Generate QR error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
