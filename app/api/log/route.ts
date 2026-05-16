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
