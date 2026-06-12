import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { getAccessibleOrganizations } from '@/lib/services/organization-service'
import { OrganisasiType } from '@prisma/client'
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
  tanggal: z.string(),
  waktu: z.string().optional().nullable(),
  lokasi: z.string().optional().nullable(),
  keterangan: z.string().optional().nullable(),
  organisasi: z.nativeEnum(OrganisasiType),
  wajib_hadir: z.boolean().default(false),
})

const updateSchema = createSchema.extend({ id: z.number().int().positive() })

export async function GET(req: NextRequest) {
  const { userId, userRole } = getCtx(req)
  const { searchParams } = new URL(req.url)
  const organisasi = searchParams.get('organisasi')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  const accessibleOrgs = await getAccessibleOrganizations(userId, userRole)
  const accessible = accessibleOrgs.map(o => o.slug)

  if (accessible.length === 0) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const where: Record<string, unknown> = { organisasi: { in: accessible } }
  if (organisasi && accessible.includes(organisasi)) {
    where.organisasi = organisasi
  }

  const [data, total] = await Promise.all([
    prisma.jadwalKegiatan.findMany({
      where,
      orderBy: { tanggal: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.jadwalKegiatan.count({ where }),
  ])

  return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const ctx = getCtx(req)
  const accessibleOrgs = await getAccessibleOrganizations(ctx.userId, ctx.userRole)
  const accessible = accessibleOrgs.map(o => o.slug)

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    if (!accessible.includes(parsed.data.organisasi)) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

    const jadwal = await prisma.jadwalKegiatan.create({
      data: { 
        ...parsed.data, 
        tanggal: new Date(parsed.data.tanggal), 
        created_by: ctx.userId,
      },
    })

    await createLog({
      userId: ctx.userId, userNama: ctx.userNama, aksi: 'CREATE',
      tabel: 'jadwal_kegiatan', recordId: jadwal.id,
      deskripsi: `${ctx.userNama} menambahkan jadwal "${jadwal.judul}" untuk ${jadwal.organisasi}`,
      dataBaru: parsed.data, ipAddress: getIp(req),
    })

    return NextResponse.json({ data: jadwal }, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const ctx = getCtx(req)
  const accessibleOrgs = await getAccessibleOrganizations(ctx.userId, ctx.userRole)
  const accessible = accessibleOrgs.map(o => o.slug)

  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

    const { id, ...data } = parsed.data
    const existing = await prisma.jadwalKegiatan.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
    if (!accessible.includes(existing.organisasi)) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

    const updated = await prisma.jadwalKegiatan.update({
      where: { id }, 
      data: { 
        ...data, 
        tanggal: new Date(data.tanggal),
      },
    })

    await createLog({
      userId: ctx.userId, userNama: ctx.userNama, aksi: 'UPDATE',
      tabel: 'jadwal_kegiatan', recordId: id,
      deskripsi: `${ctx.userNama} mengedit jadwal "${updated.judul}"`,
      dataLama: existing, dataBaru: updated, ipAddress: getIp(req),
    })

    return NextResponse.json({ data: updated })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const ctx = getCtx(req)
  const accessibleOrgs = await getAccessibleOrganizations(ctx.userId, ctx.userRole)
  const accessible = accessibleOrgs.map(o => o.slug)

  const { searchParams } = new URL(req.url)
  const idStr = searchParams.get('id')
  if (!idStr) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const id = parseInt(idStr)
  const existing = await prisma.jadwalKegiatan.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
  if (!accessible.includes(existing.organisasi)) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  await prisma.jadwalKegiatan.delete({ where: { id } })

  await createLog({
    userId: ctx.userId, userNama: ctx.userNama, aksi: 'DELETE',
    tabel: 'jadwal_kegiatan', recordId: id,
    deskripsi: `${ctx.userNama} menghapus jadwal "${existing.judul}"`,
    dataLama: existing, ipAddress: getIp(req),
  })

  return NextResponse.json({ success: true })
}
