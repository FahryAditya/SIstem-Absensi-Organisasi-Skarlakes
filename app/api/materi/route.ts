import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { getAccessibleOrgs } from '@/lib/auth'
import { z } from 'zod'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

const createSchema = z.object({
  judul: z.string().min(1).max(255),
  deskripsi: z.string().min(1),
  tanggal: z.string().min(1),
  organisasi: z.enum(['programming', 'english', 'osis', 'mpk']),
  notulen: z.string().optional().nullable(),
  lokasi: z.string().max(200).optional().nullable(),
})

const updateSchema = createSchema.extend({
  id: z.number().int().positive(),
})

export async function GET(req: NextRequest) {
  const { userRole } = getCtx(req)
  const { searchParams } = new URL(req.url)
  const organisasi = searchParams.get('organisasi')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const accessible = getAccessibleOrgs(userRole)
  if (accessible.length === 0) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  const where: Record<string, unknown> = { organisasi: { in: accessible } }
  if (organisasi && accessible.includes(organisasi)) {
    where.organisasi = organisasi
  }

  const [data, total] = await Promise.all([
    prisma.materiHariIni.findMany({
      where,
      orderBy: [{ tanggal: 'desc' }, { created_at: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.materiHariIni.count({ where }),
  ])

  return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const ctx = getCtx(req)
  const accessible = getAccessibleOrgs(ctx.userRole)

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    if (!accessible.includes(parsed.data.organisasi)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const materi = await prisma.materiHariIni.create({
      data: {
        ...parsed.data,
        tanggal: new Date(parsed.data.tanggal),
        created_by: ctx.userId,
      },
    })

    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'CREATE',
      tabel: 'materi_hari_ini',
      recordId: materi.id,
      deskripsi: `${ctx.userNama} menambahkan materi/notulen "${materi.judul}"`,
      dataBaru: parsed.data,
      ipAddress: getIp(req),
    })

    return NextResponse.json({ data: materi }, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const ctx = getCtx(req)
  const accessible = getAccessibleOrgs(ctx.userRole)

  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { id, ...data } = parsed.data
    const existing = await prisma.materiHariIni.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
    }

    if (!accessible.includes(existing.organisasi)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const updated = await prisma.materiHariIni.update({
      where: { id },
      data: {
        ...data,
        tanggal: new Date(data.tanggal),
      },
    })

    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'UPDATE',
      tabel: 'materi_hari_ini',
      recordId: id,
      deskripsi: `${ctx.userNama} mengedit materi/notulen "${updated.judul}"`,
      dataLama: existing,
      dataBaru: updated,
      ipAddress: getIp(req),
    })

    return NextResponse.json({ data: updated })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const ctx = getCtx(req)
  const accessible = getAccessibleOrgs(ctx.userRole)
  const { searchParams } = new URL(req.url)
  const idStr = searchParams.get('id')
  if (!idStr) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 })
  }

  const id = parseInt(idStr)
  const existing = await prisma.materiHariIni.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
  }
  if (!accessible.includes(existing.organisasi)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  await prisma.materiHariIni.delete({ where: { id } })

  await createLog({
    userId: ctx.userId,
    userNama: ctx.userNama,
    aksi: 'DELETE',
    tabel: 'materi_hari_ini',
    recordId: id,
    deskripsi: `${ctx.userNama} menghapus materi/notulen "${existing.judul}"`,
    dataLama: existing,
    ipAddress: getIp(req),
  })

  return NextResponse.json({ success: true })
}
