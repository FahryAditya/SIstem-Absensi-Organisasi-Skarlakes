import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessibleOrgs } from '@/lib/auth'
import { calculateProgress, LEVEL_NAMES } from '@/lib/exp'

function getCtx(req: NextRequest) {
  return { userRole: req.headers.get('x-user-role') || '' }
}

export async function GET(req: NextRequest) {
  const { userRole } = getCtx(req)
  const { searchParams } = new URL(req.url)
  const organisasi = searchParams.get('organisasi') || 'programming'
  const limit = parseInt(searchParams.get('limit') || '10')

  const accessible = getAccessibleOrgs(userRole)
  if (!accessible.includes(organisasi)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  let data: { id: number; nama: string; kelas: string | null; jabatan: string | null; foto_url: string | null; xp: number; level: number }[] = []

  if (organisasi === 'programming' || organisasi === 'english') {
    const rows = await prisma.siswa.findMany({
      where: { ekskul: organisasi as 'programming' | 'english' },
      select: { id: true, nama: true, kelas: true, jabatan: true, foto_url: true, xp: true, level: true },
      orderBy: [{ xp: 'desc' }, { nama: 'asc' }],
      take: limit,
    })
    data = rows
  } else if (organisasi === 'osis') {
    const rows = await prisma.anggotaOsis.findMany({
      select: { id: true, nama: true, kelas: true, jabatan: true, foto_url: true, xp: true, level: true },
      orderBy: [{ xp: 'desc' }, { nama: 'asc' }],
      take: limit,
    })
    data = rows
  } else {
    const rows = await prisma.anggotaMpk.findMany({
      select: { id: true, nama: true, kelas: true, jabatan: true, foto_url: true, xp: true, level: true },
      orderBy: [{ xp: 'desc' }, { nama: 'asc' }],
      take: limit,
    })
    data = rows
  }

  const withProgress = data.map((item, index) => ({
    ...item,
    rank: index + 1,
    levelName: LEVEL_NAMES[item.level] ?? 'Beginner',
    progress: calculateProgress(item.xp, item.level),
  }))

  return NextResponse.json({ data: withProgress, organisasi })
}
