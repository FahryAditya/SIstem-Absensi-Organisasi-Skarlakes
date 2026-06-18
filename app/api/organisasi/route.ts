import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { getSessionFromRequest } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

function isSuperAdmin(role: string) {
  return role === 'SUPER_ADMIN' || role === 'administrator' || role === 'admin_osis_mpk'
}

const schema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  nis: z.string().nullable().optional(),
  class: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  jabatan: z.string().nullable().optional(),
  tipe: z.string().optional(), // For legacy compatibility
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const orgId = searchParams.get('orgId')
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '15')

    // Find orgId from slug if provided (legacy UI compatibility)
    let filterOrgId = orgId ? parseInt(orgId) : session.activeOrgId
    const slug = searchParams.get('tipe') // old UI uses 'tipe' for 'osis' or 'mpk'
    if (!filterOrgId && slug) {
       const org = await prisma.organization.findUnique({ where: { slug } })
       filterOrgId = org?.id
    }

    if (!filterOrgId && !isSuperAdmin(session.role as string)) {
      return NextResponse.json({ error: 'No active organization selected' }, { status: 400 })
    }

    // RBAC Check
    if (!isSuperAdmin(session.role as string) && filterOrgId && !session.orgIds.includes(filterOrgId)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const where: any = {
      ...(filterOrgId ? { organization_id: filterOrgId } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      status: 'ACTIVE'
    }

    const [data, total] = await Promise.all([
      prisma.member.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.member.count({ where }),
    ])

    // Map to legacy 'nama' for UI if needed
    const formattedData = data.map(m => ({
       ...m,
       nama: m.name, // compatibility with legacy UI
       kelas: m.class
    }))

    return NextResponse.json({ 
      data: formattedData, 
      total, 
      page, 
      totalPages: Math.ceil(total / limit) 
    })
  } catch (error) {
    console.error('[ORGANISASI GET ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

    let activeOrgId = session.activeOrgId
    if (!activeOrgId && body.tipe) {
      const org = await prisma.organization.findUnique({ where: { slug: body.tipe } })
      activeOrgId = org?.id
    }

    if (!activeOrgId) return NextResponse.json({ error: 'No active organization' }, { status: 400 })

    if (!isSuperAdmin(session.role as string) && !session.orgIds.includes(activeOrgId)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const member = await prisma.member.create({
      data: {
        name: parsed.data.name,
        nis: parsed.data.nis,
        class: parsed.data.class,
        email: parsed.data.email,
        jabatan: parsed.data.jabatan,
        organization_id: activeOrgId,
      }
    })

    await createLog({
      userId: session.id,
      userNama: session.nama,
      aksi: 'CREATE',
      organizationId: activeOrgId,
      tabel: 'members',
      recordId: member.id,
      deskripsi: `Tambah anggota "${member.name}"`,
      ipAddress: getIp(req),
    })

    return NextResponse.json({ success: true, data: member })
  } catch (error) {
    console.error('[ORGANISASI POST ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const existing = await prisma.member.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })

    if (!isSuperAdmin(session.role as string) && !session.orgIds.includes(existing.organization_id)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const updated = await prisma.member.update({
      where: { id },
      data: {
        name: rest.name || rest.nama,
        nis: rest.nis,
        class: rest.class || rest.kelas,
        email: rest.email,
        jabatan: rest.jabatan,
      }
    })

    await createLog({
      userId: session.id,
      userNama: session.nama,
      aksi: 'UPDATE',
      organizationId: existing.organization_id,
      tabel: 'members',
      recordId: id,
      deskripsi: `Ubah data anggota "${updated.name}"`,
      ipAddress: getIp(req),
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('[ORGANISASI PUT ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id') || '0')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const existing = await prisma.member.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })

    if (!isSuperAdmin(session.role as string) && !session.orgIds.includes(existing.organization_id)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    await prisma.member.delete({ where: { id } })

    await createLog({
      userId: session.id,
      userNama: session.nama,
      aksi: 'DELETE',
      organizationId: existing.organization_id,
      tabel: 'members',
      recordId: id,
      deskripsi: `Hapus anggota "${existing.name}"`,
      ipAddress: getIp(req),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ORGANISASI DELETE ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
