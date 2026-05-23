import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { getAccessibleOrgs, isAdministrator } from '@/lib/auth'
import { z } from 'zod'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

const createSchema = z.object({
  icon: z.string().min(1, 'Icon wajib diisi').max(100),
  nama: z.string().min(1, 'Nama wajib diisi').max(150),
  deskripsi: z.string().min(1, 'Deskripsi wajib diisi'),
  exp_reward: z.number().int().min(1, 'EXP reward minimal 1'),
  organisasi: z.enum(['programming', 'english', 'osis', 'mpk', 'semua']),
})

const updateSchema = createSchema.extend({
  id: z.number().int().positive(),
})

// GET: List semua pencapaian (+ filter organisasi)
export async function GET(req: NextRequest) {
  const { userRole } = getCtx(req)
  const { searchParams } = new URL(req.url)
  const organisasi = searchParams.get('organisasi')
  const withPenerima = searchParams.get('with_penerima') === 'true'

  const accessible = getAccessibleOrgs(userRole)
  if (accessible.length === 0) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  const where: Record<string, unknown> = { organisasi: { in: [...accessible, 'semua'] } }
  if (organisasi && (accessible.includes(organisasi) || organisasi === 'semua')) {
    where.organisasi = organisasi
  }

  const data = await prisma.pencapaian.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: withPenerima ? { penerima: true } : undefined,
  })

  return NextResponse.json({ data })
}

// POST: Buat pencapaian baru
export async function POST(req: NextRequest) {
  const ctx = getCtx(req)
  if (!isAdministrator(ctx.userRole)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const pencapaian = await prisma.pencapaian.create({ data: parsed.data })

    await createLog({
      userId: ctx.userId, userNama: ctx.userNama, aksi: 'CREATE',
      tabel: 'pencapaian', recordId: pencapaian.id,
      deskripsi: `${ctx.userNama} membuat pencapaian baru: "${pencapaian.nama}"`,
      dataBaru: parsed.data,
      ipAddress: getIp(req),
    })

    return NextResponse.json({ data: pencapaian }, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// PUT: Edit pencapaian
export async function PUT(req: NextRequest) {
  const ctx = getCtx(req)
  if (!isAdministrator(ctx.userRole)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { id, ...data } = parsed.data
    const existing = await prisma.pencapaian.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Pencapaian tidak ditemukan' }, { status: 404 })

    const updated = await prisma.pencapaian.update({ where: { id }, data })

    await createLog({
      userId: ctx.userId, userNama: ctx.userNama, aksi: 'UPDATE',
      tabel: 'pencapaian', recordId: id,
      deskripsi: `${ctx.userNama} mengedit pencapaian: "${updated.nama}"`,
      dataLama: existing, dataBaru: updated,
      ipAddress: getIp(req),
    })

    return NextResponse.json({ data: updated })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE: Hapus pencapaian
export async function DELETE(req: NextRequest) {
  const ctx = getCtx(req)
  if (!isAdministrator(ctx.userRole)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const idStr = searchParams.get('id')
  if (!idStr) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const id = parseInt(idStr)
  const existing = await prisma.pencapaian.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Pencapaian tidak ditemukan' }, { status: 404 })

  await prisma.pencapaian.delete({ where: { id } })

  await createLog({
    userId: ctx.userId, userNama: ctx.userNama, aksi: 'DELETE',
    tabel: 'pencapaian', recordId: id,
    deskripsi: `${ctx.userNama} menghapus pencapaian: "${existing.nama}"`,
    dataLama: existing,
    ipAddress: getIp(req),
  })

  return NextResponse.json({ success: true })
}
