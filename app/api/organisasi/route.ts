import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { canAccessOsis, canAccessMpk } from '@/lib/auth'
import { jsonWithPrivateCache } from '@/lib/api-cache'
import { z } from 'zod'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

const anggotaSchema = z.object({
  nis: z.string().nullable().optional().refine(val => !val || /^\d+$/.test(val), { message: 'NIS hanya boleh berisi angka' }),
  nama: z.string().min(1, 'Nama wajib diisi').regex(/^[a-zA-Z\s.'\']*$/, 'Nama hanya boleh berisi huruf'),
  kelas: z.string().nullable().optional(),
  jabatan: z.string().nullable().optional(),
  tipe: z.enum(['osis', 'mpk']),
})

// GET: list anggota OSIS atau MPK
export async function GET(req: NextRequest) {
  const { userRole } = getCtx(req)
  const { searchParams } = new URL(req.url)
  const tipe = searchParams.get('tipe') as 'osis' | 'mpk' | null
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)

  if (tipe === 'osis' && !canAccessOsis(userRole))
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  if (tipe === 'mpk' && !canAccessMpk(userRole))
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const whereSearch = search ? { nama: { contains: search } } : {}

  if (tipe === 'osis') {
    const [data, total] = await Promise.all([
      prisma.anggotaOsis.findMany({ where: whereSearch, orderBy: { nama: 'asc' }, skip: (page-1)*limit, take: limit }),
      prisma.anggotaOsis.count({ where: whereSearch }),
    ])
    return jsonWithPrivateCache({ data, total, totalPages: Math.ceil(total/limit) })
  }

  if (tipe === 'mpk') {
    const [data, total] = await Promise.all([
      prisma.anggotaMpk.findMany({ where: whereSearch, orderBy: { nama: 'asc' }, skip: (page-1)*limit, take: limit }),
      prisma.anggotaMpk.count({ where: whereSearch }),
    ])
    return jsonWithPrivateCache({ data, total, totalPages: Math.ceil(total/limit) })
  }

  // Both (if admin has access to both)
  const results: Record<string, unknown> = {}
  if (canAccessOsis(userRole)) {
    results.osis = await prisma.anggotaOsis.findMany({ where: whereSearch, orderBy: { nama: 'asc' } })
  }
  if (canAccessMpk(userRole)) {
    results.mpk = await prisma.anggotaMpk.findMany({ where: whereSearch, orderBy: { nama: 'asc' } })
  }
  return jsonWithPrivateCache(results)
}

export async function POST(req: NextRequest) {
  const ctx = getCtx(req)
  const body = await req.json()
  const parsed = anggotaSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { tipe, ...data } = parsed.data

  if (tipe === 'osis' && !canAccessOsis(ctx.userRole))
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  if (tipe === 'mpk' && !canAccessMpk(ctx.userRole))
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  let anggota: Record<string, unknown>
  if (tipe === 'osis') {
    anggota = await prisma.anggotaOsis.create({ data })
  } else {
    anggota = await prisma.anggotaMpk.create({ data })
  }

  await createLog({
    userId: ctx.userId, userNama: ctx.userNama, aksi: 'CREATE',
    tabel: `anggota_${tipe}`, recordId: (anggota as { id: number }).id,
    deskripsi: `${ctx.userNama} menambahkan anggota "${data.nama}" ke ${tipe.toUpperCase()}`,
    dataBaru: data, ipAddress: getIp(req),
  })

  return NextResponse.json({ data: anggota }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const ctx = getCtx(req)
  const body = await req.json()
  const { id, ...rest } = body
  const parsed = anggotaSchema.safeParse(rest)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  const { tipe, ...data } = parsed.data
  if (!id || !tipe) return NextResponse.json({ error: 'ID dan tipe required' }, { status: 400 })

  if (tipe === 'osis' && !canAccessOsis(ctx.userRole))
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  if (tipe === 'mpk' && !canAccessMpk(ctx.userRole))
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  let existing: Record<string, unknown> | null = null
  let updated: Record<string, unknown>

  if (tipe === 'osis') {
    existing = await prisma.anggotaOsis.findUnique({ where: { id } })
    updated = await prisma.anggotaOsis.update({ where: { id }, data })
  } else {
    existing = await prisma.anggotaMpk.findUnique({ where: { id } })
    updated = await prisma.anggotaMpk.update({ where: { id }, data })
  }

  await createLog({
    userId: ctx.userId, userNama: ctx.userNama, aksi: 'UPDATE',
    tabel: `anggota_${tipe}`, recordId: id,
    deskripsi: `${ctx.userNama} mengubah data anggota "${data.nama || (existing as { nama?: string })?.nama}" di ${tipe.toUpperCase()}`,
    dataLama: existing as Record<string, unknown>, dataBaru: data, ipAddress: getIp(req),
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(req: NextRequest) {
  const ctx = getCtx(req)
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get('id') || '0')
  const tipe = searchParams.get('tipe') as 'osis' | 'mpk'
  if (!id || !tipe) return NextResponse.json({ error: 'ID dan tipe required' }, { status: 400 })

  if (tipe === 'osis' && !canAccessOsis(ctx.userRole))
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  if (tipe === 'mpk' && !canAccessMpk(ctx.userRole))
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  let nama = ''
  if (tipe === 'osis') {
    const ex = await prisma.anggotaOsis.findUnique({ where: { id } })
    nama = ex?.nama || ''
    await prisma.anggotaOsis.delete({ where: { id } })
  } else {
    const ex = await prisma.anggotaMpk.findUnique({ where: { id } })
    nama = ex?.nama || ''
    await prisma.anggotaMpk.delete({ where: { id } })
  }

  await createLog({
    userId: ctx.userId, userNama: ctx.userNama, aksi: 'DELETE',
    tabel: `anggota_${tipe}`, recordId: id,
    deskripsi: `${ctx.userNama} menghapus anggota "${nama}" dari ${tipe.toUpperCase()}`,
    ipAddress: getIp(req),
  })

  return NextResponse.json({ success: true })
}
