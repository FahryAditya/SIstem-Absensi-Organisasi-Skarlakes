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
    const { organisasiType, jadwalMulai, jadwalSelesai } = body

    if (!organisasiType) {
      return NextResponse.json(
        { success: false, message: 'Tipe organisasi wajib diisi' },
        { status: 400 }
      )
    }

    // Validate organisasiType
    const validTypes = ['programming', 'english', 'osis', 'mpk']
    if (!validTypes.includes(organisasiType)) {
      return NextResponse.json(
        { success: false, message: 'Tipe organisasi tidak valid' },
        { status: 400 }
      )
    }

    const sesi = await prisma.sesiWawancara.create({
      data: {
        status: 'ACTIVE',
        organisasi_type: organisasiType,
        jadwal_mulai: jadwalMulai ? new Date(jadwalMulai) : null,
        jadwal_selesai: jadwalSelesai ? new Date(jadwalSelesai) : null,
        created_by: payload.userId as number,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Sesi wawancara berhasil dibuat',
      data: {
        id: sesi.id,
        status: sesi.status,
        organisasiType: sesi.organisasi_type,
        jadwalMulai: sesi.jadwal_mulai,
        jadwalSelesai: sesi.jadwal_selesai,
        createdAt: sesi.created_at,
      }
    })

  } catch (error) {
    console.error('Create session error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
