import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token') || ''
  const id = parseInt(searchParams.get('sesi') || '0')

  if (token) {
    const qr = await prisma.qrWawancara.findUnique({
      where: { token },
      include: {
        sesi: {
          select: {
            id: true,
            organisasi_type: true,
            status: true,
            jadwal_mulai: true,
            jadwal_selesai: true,
            _count: { select: { antrian: true } },
          },
        },
      },
    })
    const now = new Date()
    if (!qr || !qr.aktif || qr.valid_from > now || qr.valid_until < now || qr.sesi.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'QR tidak aktif atau sudah expired' }, { status: 404 })
    }
    return NextResponse.json({ data: { ...qr.sesi, qr: { id: qr.id, token: qr.token, valid_until: qr.valid_until } } })
  }

  if (!id) return NextResponse.json({ error: 'Sesi tidak valid' }, { status: 400 })

  const sesi = await prisma.sesiWawancara.findUnique({
    where: { id },
    select: {
      id: true,
      organisasi_type: true,
      status: true,
      jadwal_mulai: true,
      jadwal_selesai: true,
      _count: { select: { antrian: true } },
    },
  })

  if (!sesi || sesi.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Sesi wawancara tidak aktif' }, { status: 404 })
  }

  return NextResponse.json({ data: sesi })
}
