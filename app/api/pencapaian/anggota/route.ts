import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canAccessEnglish, canAccessMpk, canAccessOsis, canAccessProgramming } from '@/lib/auth'
import { z } from 'zod'

function getCtx(req: NextRequest) {
  return {
    userRole: req.headers.get('x-user-role') || '',
  }
}

const querySchema = z.object({
  tipe_anggota: z.enum(['siswa', 'anggota_osis', 'anggota_mpk']),
  target_id: z.coerce.number().int().positive(),
})

export async function GET(req: NextRequest) {
  const { userRole } = getCtx(req)
  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse({
    tipe_anggota: searchParams.get('tipe_anggota'),
    target_id: searchParams.get('target_id'),
  })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { tipe_anggota, target_id } = parsed.data

  if (tipe_anggota === 'siswa') {
    const siswa = await prisma.siswa.findUnique({ where: { id: target_id } })
    if (!siswa) return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })
    if (siswa.ekskul === 'programming' && !canAccessProgramming(userRole)) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    if (siswa.ekskul === 'english' && !canAccessEnglish(userRole)) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  } else if (tipe_anggota === 'anggota_osis') {
    if (!canAccessOsis(userRole)) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  } else if (!canAccessMpk(userRole)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  const where = tipe_anggota === 'siswa'
    ? { siswa_id: target_id }
    : tipe_anggota === 'anggota_osis'
      ? { anggota_osis_id: target_id }
      : { anggota_mpk_id: target_id }

  const data = await prisma.siswaPencapaian.findMany({
    where,
    include: { pencapaian: true },
    orderBy: { tanggal: 'desc' },
  })

  return NextResponse.json({ data })
}
