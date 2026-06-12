import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { z } from 'zod'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
    activeOrgId: req.headers.get('x-active-org-id') ? parseInt(req.headers.get('x-active-org-id')!) : undefined
  }
}

const schema = z.object({
  nis: z.string().nullable().optional().refine(
    (val) => !val || /^\d+$/.test(val),
    'NIS hanya boleh berisi angka'
  ),
  name: z.string().min(1, 'Nama wajib diisi').regex(
    /^[a-zA-Z\s.'']*$/,
    'Nama hanya boleh berisi huruf'
  ),
  class: z.string().nullable().optional(),
  email: z.string().email('Email tidak valid').nullable().optional(),
  jabatan: z.string().nullable().optional(),
  status: z.string().default('ACTIVE'),
})

export async function GET(req: NextRequest) {
  const { userRole, activeOrgId } = getCtx(req)
  const { searchParams } = new URL(req.url)

  const filterOrgId = userRole === 'SUPER_ADMIN' ? (searchParams.get('orgId') ? parseInt(searchParams.get('orgId')!) : activeOrgId) : activeOrgId

  if (!filterOrgId && userRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No active organization selected' }, { status: 400 })
  }

  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || 'ACTIVE'
  
  let page = parseInt(searchParams.get('page') || '1')
  let limit = parseInt(searchParams.get('limit') || '10')
  if (isNaN(page) || page < 1) page = 1
  if (isNaN(limit) || limit < 1) limit = 10

  const where: any = {
    ...(filterOrgId ? { organization_id: filterOrgId } : {}),
    status,
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.member.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { organization: { select: { nama: true, slug: true } } }
    }),
    prisma.member.count({ where }),
  ])

  return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const ctx = getCtx(req)
  const activeOrgId = ctx.activeOrgId

  if (!activeOrgId) {
    return NextResponse.json({ error: 'No active organization selected' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const nameTrimmed = parsed.data.name.trim()

  // Prevent duplicates in same organization
  const duplikat = await prisma.member.findFirst({
    where: {
      organization_id: activeOrgId,
      name: { equals: nameTrimmed, mode: 'insensitive' },
    },
  })

  if (duplikat) {
    return NextResponse.json(
      { error: `Anggota "${duplikat.name}" sudah terdaftar di organisasi ini.` },
      { status: 409 }
    )
  }

  const member = await prisma.member.create({
    data: { 
      ...parsed.data, 
      name: nameTrimmed, 
      organization_id: activeOrgId 
    },
  })

  await createLog({
    userId: ctx.userId, 
    userNama: ctx.userNama, 
    aksi: 'CREATE',
    organizationId: activeOrgId,
    tabel: 'members', 
    recordId: member.id,
    deskripsi: `Menambahkan anggota "${member.name}"`,
    dataBaru: { ...parsed.data },
    ipAddress: getIp(req),
  })

  return NextResponse.json({ data: member }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const ctx = getCtx(req)
  const activeOrgId = ctx.activeOrgId
  const body = await req.json()
  const { id, ...rest } = body

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  if (!activeOrgId && ctx.userRole !== 'SUPER_ADMIN') return NextResponse.json({ error: 'No active organization' }, { status: 400 })

  const existing = await prisma.member.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })

  // Verify ownership unless super admin
  if (ctx.userRole !== 'SUPER_ADMIN' && existing.organization_id !== activeOrgId) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  const parsed = schema.safeParse({ ...existing, ...rest })
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const nameTrimmed = parsed.data.name.trim()

  const updated = await prisma.member.update({
    where: { id },
    data: { ...parsed.data, name: nameTrimmed },
  })

  await createLog({
    userId: ctx.userId, 
    userNama: ctx.userNama, 
    aksi: 'UPDATE',
    organizationId: existing.organization_id,
    tabel: 'members', 
    recordId: id,
    deskripsi: `Mengubah data anggota "${updated.name}"`,
    dataLama: { name: existing.name, class: existing.class, nis: existing.nis },
    dataBaru: { name: updated.name, class: updated.class, nis: updated.nis },
    ipAddress: getIp(req),
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(req: NextRequest) {
  const ctx = getCtx(req)
  const { searchParams } = new URL(req.url)
  const idStr = searchParams.get('id')
  
  if (!idStr) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  const id = parseInt(idStr)

  const existing = await prisma.member.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })

  if (ctx.userRole !== 'SUPER_ADMIN' && existing.organization_id !== ctx.activeOrgId) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  await prisma.member.delete({ where: { id } })

  await createLog({
    userId: ctx.userId, 
    userNama: ctx.userNama, 
    aksi: 'DELETE',
    organizationId: existing.organization_id,
    tabel: 'members', 
    recordId: id,
    deskripsi: `Menghapus anggota "${existing.name}"`,
    dataLama: { name: existing.name },
    ipAddress: getIp(req),
  })

  return NextResponse.json({ success: true })
}
