import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const userRole = req.headers.get('x-user-role')?.trim() || ''
  if (userRole !== 'administrator') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const tabel = searchParams.get('tabel') || ''
  const aksi = searchParams.get('aksi') || ''

  const where: Record<string, unknown> = {}
  if (search) where.OR = [
    { user_nama: { contains: search } },
    { deskripsi: { contains: search } },
  ]
  if (tabel) where.tabel = tabel
  if (aksi) where.aksi = aksi

  const [data, total] = await Promise.all([
    prisma.logAktivitas.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { nama: true, role: true } } }
    }),
    prisma.logAktivitas.count({ where }),
  ])

  return NextResponse.json({ data, total, totalPages: Math.ceil(total / limit) })
}

export async function DELETE(req: NextRequest) {
  const userRole = req.headers.get('x-user-role')?.trim() || ''
  const userIdStr = req.headers.get('x-user-id')?.trim() || ''
  const userNama = req.headers.get('x-user-nama')?.trim() || ''

  if (userRole !== 'administrator') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const userId = parseInt(userIdStr)
  if (isNaN(userId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Delete all logs
    await prisma.logAktivitas.deleteMany()

    // 2. Create an audit log about clearing the logs
    const forwarded = req.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'

    await prisma.logAktivitas.create({
      data: {
        user_id: userId,
        user_nama: userNama,
        aksi: 'DELETE',
        tabel: 'log_aktivitas',
        deskripsi: `Administrator ${userNama} bersihkan seluruh log aktivitas.`,
        ip_address: ipAddress,
      }
    })

    return NextResponse.json({ success: true, message: 'Log berhasil dibersihkan' })
  } catch (error: any) {
    console.error('[CLEAR LOG ERROR]', error)
    return NextResponse.json({ error: 'Gagal membersihkan log: ' + error.message }, { status: 500 })
  }
}

