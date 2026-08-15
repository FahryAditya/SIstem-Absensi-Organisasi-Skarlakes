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
    const status = searchParams.get('status')
    const organisasiType = searchParams.get('organisasiType')

    const where: any = {}
    if (status) where.status = status
    if (organisasiType) where.organisasi_type = organisasiType

    const sessions = await prisma.sesiWawancara.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        qr_codes: {
          select: {
            id: true,
            token: true,
            aktif: true,
            valid_until: true,
          }
        },
        antrian: {
          select: {
            id: true,
            status: true,
          }
        },
        chat: {
          select: {
            id: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: sessions.map(sesi => ({
        id: sesi.id,
        status: sesi.status,
        organisasiType: sesi.organisasi_type,
        jadwalMulai: sesi.jadwal_mulai,
        jadwalSelesai: sesi.jadwal_selesai,
        finalizedAt: sesi.finalized_at,
        lockedAt: sesi.locked_at,
        createdAt: sesi.created_at,
        totalQrCodes: sesi.qr_codes.length,
        activeQrCodes: sesi.qr_codes.filter(qr => qr.aktif).length,
        totalAntrian: sesi.antrian.length,
        antrianMenunggu: sesi.antrian.filter(a => a.status === 'MENUNGGU').length,
        antrianSelesai: sesi.antrian.filter(a => a.status === 'SELESAI').length,
        totalMessages: sesi.chat.length,
      }))
    })

  } catch (error) {
    console.error('List sessions error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
