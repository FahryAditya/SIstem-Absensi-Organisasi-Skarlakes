import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { canAccessEnglish, canAccessProgramming } from '@/lib/auth'
import { z } from 'zod'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

export async function GET(req: NextRequest) {
  const { userRole } = getCtx(req)
  const { searchParams } = new URL(req.url)
  const tanggal = searchParams.get('tanggal')
  const ekskul = searchParams.get('ekskul') as 'programming' | 'english' | null
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  // Build accessible ekskul filter
  const accessible: string[] = []
  if (canAccessProgramming(userRole)) accessible.push('programming')
  if (canAccessEnglish(userRole)) accessible.push('english')

  let ekskulFilter = accessible
  if (ekskul && accessible.includes(ekskul)) ekskulFilter = [ekskul]

  const where: Record<string, unknown> = {
    siswa: { ekskul: { in: ekskulFilter } },
    ...(tanggal ? { tanggal: new Date(tanggal) } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.absensi.findMany({
      where,
      include: { siswa: true, creator: { select: { id: true, nama: true } } },
      orderBy: [{ tanggal: 'desc' }, { siswa: { nama: 'asc' } }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.absensi.count({ where }),
  ])

  return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
}

// Bulk upsert absensi
const bulkSchema = z.object({
  tanggal: z.string(),
  rows: z.array(z.object({
    siswa_id: z.number(),
    status: z.enum(['hadir', 'tidak_hadir', 'izin', 'sakit']),
    uang_kas: z.number().min(0).default(0),
    keterangan: z.string().nullable().optional(),
  }))
})

export async function POST(req: NextRequest) {
  const ctx = getCtx(req)
  const body = await req.json()
  const parsed = bulkSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { tanggal, rows } = parsed.data
  const tanggalDate = new Date(tanggal)

  // Verify access for each siswa
  const siswaIds = rows.map(r => r.siswa_id)
  const siswaList = await prisma.siswa.findMany({
    where: { id: { in: siswaIds } },
    select: { id: true, nama: true, ekskul: true }
  })

  for (const s of siswaList) {
    if (s.ekskul === 'programming' && !canAccessProgramming(ctx.userRole))
      return NextResponse.json({ error: 'Akses ditolak untuk ekskul Programming' }, { status: 403 })
    if (s.ekskul === 'english' && !canAccessEnglish(ctx.userRole))
      return NextResponse.json({ error: 'Akses ditolak untuk ekskul English' }, { status: 403 })
  }

  // Fetch existing to compare
  const existing = await prisma.absensi.findMany({
    where: { siswa_id: { in: siswaIds }, tanggal: tanggalDate }
  })

  // Upsert all
  const results = await Promise.all(rows.map(async (row) => {
    const ex = existing.find(e => e.siswa_id === row.siswa_id)
    if (ex) {
      return prisma.absensi.update({
        where: { id: ex.id },
        data: { status: row.status, uang_kas: row.uang_kas, keterangan: row.keterangan, updated_by: ctx.userId }
      })
    } else {
      return prisma.absensi.create({
        data: { siswa_id: row.siswa_id, tanggal: tanggalDate, status: row.status, uang_kas: row.uang_kas, keterangan: row.keterangan, created_by: ctx.userId }
      })
    }
  }))

  // Log
  const siswaMap = Object.fromEntries(siswaList.map(s => [s.id, s.nama]))
  const summary = rows.map(r => `${siswaMap[r.siswa_id] || r.siswa_id}: ${r.status}`).join(', ')
  await createLog({
    userId: ctx.userId, userNama: ctx.userNama, aksi: 'UPDATE',
    tabel: 'absensi', deskripsi: `${ctx.userNama} menyimpan absensi tanggal ${tanggal} (${rows.length} siswa): ${summary}`,
    dataBaru: { tanggal, jumlah: rows.length },
    ipAddress: getIp(req),
  })

  return NextResponse.json({ success: true, count: results.length })
}

export async function PUT(req: NextRequest) {
  const ctx = getCtx(req)
  const body = await req.json()
  const { id, ...data } = body
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const existing = await prisma.absensi.findUnique({
    where: { id },
    include: { siswa: true }
  })
  if (!existing) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })

  if (existing.siswa.ekskul === 'programming' && !canAccessProgramming(ctx.userRole))
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  if (existing.siswa.ekskul === 'english' && !canAccessEnglish(ctx.userRole))
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const updated = await prisma.absensi.update({
    where: { id },
    data: { ...data, updated_by: ctx.userId },
    include: { siswa: true }
  })

  await createLog({
    userId: ctx.userId, userNama: ctx.userNama, aksi: 'UPDATE',
    tabel: 'absensi', recordId: id,
    deskripsi: `${ctx.userNama} mengubah absensi "${existing.siswa.nama}" tanggal ${existing.tanggal.toISOString().split('T')[0]}`,
    dataLama: { status: existing.status, uang_kas: existing.uang_kas },
    dataBaru: { status: updated.status, uang_kas: updated.uang_kas },
    ipAddress: getIp(req),
  })

  return NextResponse.json({ data: updated })
}
