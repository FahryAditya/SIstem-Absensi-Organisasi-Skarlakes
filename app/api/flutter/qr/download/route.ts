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
    // Verify authentication
    const payload = await verifyToken(req)
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const qrId = searchParams.get('qrId')

    if (!qrId) {
      return NextResponse.json(
        { success: false, message: 'QR ID wajib diisi' },
        { status: 400 }
      )
    }

    const qrCode = await prisma.qrWawancara.findUnique({
      where: { id: parseInt(qrId) },
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

    if (!qrCode) {
      return NextResponse.json(
        { success: false, message: 'QR Code tidak ditemukan' },
        { status: 404 }
      )
    }

    // Return data for Flutter to generate QR code image
    return NextResponse.json({
      success: true,
      data: {
        id: qrCode.id,
        token: qrCode.token,
        qrData: qrCode.token, // This is what should be encoded in QR
        qrUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/scan/${qrCode.token}`,
        aktif: qrCode.aktif,
        validFrom: qrCode.valid_from,
        validUntil: qrCode.valid_until,
        sesi: {
          id: qrCode.sesi_id,
          status: qrCode.sesi?.status,
          organisasiType: qrCode.sesi?.organisasi_type,
          jadwalMulai: qrCode.sesi?.jadwal_mulai,
          jadwalSelesai: qrCode.sesi?.jadwal_selesai,
        }
      }
    })

  } catch (error) {
    console.error('Download QR error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
