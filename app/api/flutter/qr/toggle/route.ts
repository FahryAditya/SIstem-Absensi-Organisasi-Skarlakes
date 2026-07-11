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
    const { qrId, aktif } = body

    if (!qrId || aktif === undefined) {
      return NextResponse.json(
        { success: false, message: 'QR ID dan status aktif wajib diisi' },
        { status: 400 }
      )
    }

    const qrCode = await prisma.qrWawancara.update({
      where: { id: qrId },
      data: { aktif },
      include: {
        sesi: {
          select: {
            status: true,
            organisasi_type: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `QR Code ${aktif ? 'diaktifkan' : 'dinonaktifkan'}`,
      data: {
        id: qrCode.id,
        token: qrCode.token,
        aktif: qrCode.aktif,
        validFrom: qrCode.valid_from,
        validUntil: qrCode.valid_until,
        sesi: qrCode.sesi,
      }
    })

  } catch (error) {
    console.error('Toggle QR error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
