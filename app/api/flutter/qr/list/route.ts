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
    const sesiId = searchParams.get('sesiId')
    const aktif = searchParams.get('aktif')

    const where: any = {}
    if (sesiId) where.sesi_id = parseInt(sesiId)
    if (aktif) where.aktif = aktif === 'true'

    const qrCodes = await prisma.qrWawancara.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        sesi: {
          select: {
            status: true,
            organisasi_type: true,
            jadwal_mulai: true,
            jadwal_selesai: true,
          }
        },
        antrian: {
          select: {
            id: true,
            nama: true,
            status: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: qrCodes.map(qr => ({
        id: qr.id,
        token: qr.token,
        qrUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/scan/${qr.token}`,
        aktif: qr.aktif,
        validFrom: qr.valid_from,
        validUntil: qr.valid_until,
        sesi: qr.sesi,
        totalAntrian: qr.antrian.length,
      }))
    })

  } catch (error) {
    console.error('List QR error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
