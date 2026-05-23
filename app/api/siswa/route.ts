import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { canManageSiswaData, canManageSiswaEkskul } from '@/lib/auth-shared'
import { z } from 'zod'
export const dynamic = 'force-dynamic'

let isSiswaSchemaChecked = false

async function ensureSiswaColumns() {
  if (isSiswaSchemaChecked) return
  try {
    // Check if email column exists
    const columns: any[] = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'siswa' AND column_name = 'email'
    `
    if (columns.length === 0) {
      console.log('Adding missing column "email" to "siswa" table...')
      await prisma.$executeRawUnsafe('ALTER TABLE "siswa" ADD COLUMN IF NOT EXISTS "email" VARCHAR(150);')
    }

    // Check if foto_url column exists
    const columnsFoto: any[] = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'siswa' AND column_name = 'foto_url'
    `
    if (columnsFoto.length === 0) {
      console.log('Adding missing column "foto_url" to "siswa" table...')
      await prisma.$executeRawUnsafe('ALTER TABLE "siswa" ADD COLUMN IF NOT EXISTS "foto_url" VARCHAR(255);')
    }

    // Check if jabatan column exists
    const columnsJabatan: any[] = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'siswa' AND column_name = 'jabatan'
    `
    if (columnsJabatan.length === 0) {
      console.log('Adding missing column "jabatan" to "siswa" table...')
      await prisma.$executeRawUnsafe('ALTER TABLE "siswa" ADD COLUMN IF NOT EXISTS "jabatan" VARCHAR(100);')
    }

    isSiswaSchemaChecked = true
  } catch (err) {
    console.error('Failed to ensure columns for table siswa:', err)
  }
}

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: (req.headers.get('x-user-role') || '').trim(),
  }
}

const schema = z.object({
  nis: z.string().nullable().optional().refine(
    (val) => !val || /^\d+$/.test(val),
    'NIS hanya boleh berisi angka'
  ),
  nama: z.string().min(1, 'Nama wajib diisi').regex(
    /^[a-zA-Z\s.'']*$/,
    'Nama hanya boleh berisi huruf'
  ),
  kelas: z.string().nullable().optional(),
  email: z.string().email('Email tidak valid').nullable().optional(),
  foto_url: z.string().url('URL foto tidak valid').nullable().optional(),
  ekskul: z.enum(['programming', 'english']),
})

export async function GET(req: NextRequest) {
  try {
    await ensureSiswaColumns()
    const { userRole } = getCtx(req)
    const { searchParams } = new URL(req.url)

    const ekskul = searchParams.get('ekskul') as 'programming' | 'english' | null
    const search = searchParams.get('search') || ''
    
    let page = parseInt(searchParams.get('page') || '1')
    let limit = parseInt(searchParams.get('limit') || '10')
    if (isNaN(page) || page < 1) page = 1
    if (isNaN(limit) || limit < 1) limit = 10

    // Role check
    const accessible: ('programming' | 'english')[] = canManageSiswaData(userRole) ? ['programming', 'english'] : []
    let ekskulFilter: ('programming' | 'english')[] = accessible
    if (ekskul && accessible.includes(ekskul)) ekskulFilter = [ekskul]

    if (ekskulFilter.length === 0) {
      return NextResponse.json({ data: [], total: 0, page, totalPages: 0 })
    }

    const where = {
      ekskul: { in: ekskulFilter },
      ...(search ? { nama: { contains: search, mode: 'insensitive' as any } } : {}),
    }

    const [data, total] = await Promise.all([
      prisma.siswa.findMany({
        where,
        orderBy: [{ ekskul: 'asc' }, { nama: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.siswa.count({ where }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error: any) {
    console.error('GET siswa error:', error)
    return NextResponse.json({ error: 'Gagal memuat data siswa: ' + error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const ctx = getCtx(req)
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { ekskul } = parsed.data
  if (!canManageSiswaEkskul(ctx.userRole, ekskul))
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  // ── Cegah duplikat: cek nama yang sama (case-insensitive) di ekskul yang sama ──
  const namaTrimmed = parsed.data.nama.trim()

  const duplikat = await prisma.siswa.findFirst({
    where: {
      ekskul,
      nama: { equals: namaTrimmed, mode: 'insensitive' },
    },
  })

  if (duplikat) {
    return NextResponse.json(
      { error: `Siswa "${duplikat.nama}" sudah terdaftar di ekskul ${ekskul}. Gunakan nama yang berbeda atau periksa data yang sudah ada.` },
      { status: 409 }
    )
  }

  // ── Cek duplikat NIS jika NIS diisi ──────────────────────────────────────
  if (parsed.data.nis && parsed.data.nis.trim() !== '') {
    const duplikatNis = await prisma.siswa.findFirst({
      where: { ekskul, nis: parsed.data.nis.trim() },
    })
    if (duplikatNis) {
      return NextResponse.json(
        { error: `NIS "${parsed.data.nis}" sudah digunakan oleh siswa "${duplikatNis.nama}" di ekskul ${ekskul}.` },
        { status: 409 }
      )
    }
  }

  const siswa = await prisma.siswa.create({
    data: { ...parsed.data, nama: namaTrimmed, created_by: ctx.userId },
  })

  await createLog({
    userId: ctx.userId, userNama: ctx.userNama, aksi: 'CREATE',
    tabel: 'siswa', recordId: siswa.id,
    deskripsi: `${ctx.userNama} menambahkan siswa "${siswa.nama}" ke ${ekskul}`,
    dataBaru: { ...parsed.data },
    ipAddress: getIp(req),
  })

  return NextResponse.json({ data: siswa }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const ctx = getCtx(req)
  const body = await req.json()
  const { id, ...rest } = body
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const existing = await prisma.siswa.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })

  if (!canManageSiswaEkskul(ctx.userRole, existing.ekskul))
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const parsed = schema.safeParse({ ...existing, ...rest })
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  if (!canManageSiswaEkskul(ctx.userRole, parsed.data.ekskul))
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const namaTrimmed = parsed.data.nama.trim()

  // ── Cegah duplikat nama saat update (kecuali record sendiri) ─────────────
  const duplikat = await prisma.siswa.findFirst({
    where: {
      ekskul: parsed.data.ekskul,
      nama: { equals: namaTrimmed, mode: 'insensitive' },
      NOT: { id },
    },
  })
  if (duplikat) {
    return NextResponse.json(
      { error: `Siswa "${duplikat.nama}" sudah terdaftar di ekskul ${parsed.data.ekskul}.` },
      { status: 409 }
    )
  }

  // ── Cek duplikat NIS saat update ─────────────────────────────────────────
  if (parsed.data.nis && parsed.data.nis.trim() !== '') {
    const duplikatNis = await prisma.siswa.findFirst({
      where: { ekskul: parsed.data.ekskul, nis: parsed.data.nis.trim(), NOT: { id } },
    })
    if (duplikatNis) {
      return NextResponse.json(
        { error: `NIS "${parsed.data.nis}" sudah digunakan oleh siswa "${duplikatNis.nama}".` },
        { status: 409 }
      )
    }
  }

  const updated = await prisma.siswa.update({
    where: { id },
    data: { ...parsed.data, nama: namaTrimmed },
  })

  await createLog({
    userId: ctx.userId, userNama: ctx.userNama, aksi: 'UPDATE',
    tabel: 'siswa', recordId: id,
    deskripsi: `${ctx.userNama} mengubah data siswa "${updated.nama}"`,
    dataLama: { nama: existing.nama, kelas: existing.kelas, nis: existing.nis },
    dataBaru: { nama: updated.nama, kelas: updated.kelas, nis: updated.nis },
    ipAddress: getIp(req),
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(req: NextRequest) {
  const ctx = getCtx(req)
  const { searchParams } = new URL(req.url)
  const idStr = searchParams.get('id')
  const idsStr = searchParams.get('ids')

  let idsToDelete: number[] = []

  if (idStr) {
    const id = parseInt(idStr)
    if (id) idsToDelete.push(id)
  } else if (idsStr) {
    idsToDelete = idsStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
  }

  if (idsToDelete.length === 0) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const existingRecords = await prisma.siswa.findMany({ where: { id: { in: idsToDelete } } })
  if (existingRecords.length === 0) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })

  for (const existing of existingRecords) {
    if (!canManageSiswaEkskul(ctx.userRole, existing.ekskul))
      return NextResponse.json({ error: `Akses ditolak untuk data ${existing.nama}` }, { status: 403 })
  }

  await prisma.siswa.deleteMany({ where: { id: { in: idsToDelete } } })

  if (idsToDelete.length === 1) {
    const existing = existingRecords[0]
    await createLog({
      userId: ctx.userId, userNama: ctx.userNama, aksi: 'DELETE',
      tabel: 'siswa', recordId: existing.id,
      deskripsi: `${ctx.userNama} menghapus siswa "${existing.nama}" dari ${existing.ekskul}`,
      dataLama: { nama: existing.nama, ekskul: existing.ekskul },
      ipAddress: getIp(req),
    })
  } else {
    await createLog({
      userId: ctx.userId, userNama: ctx.userNama, aksi: 'DELETE',
      tabel: 'siswa', recordId: 0,
      deskripsi: `${ctx.userNama} menghapus ${idsToDelete.length} data siswa sekaligus`,
      dataLama: { count: idsToDelete.length, ids: idsToDelete },
      ipAddress: getIp(req),
    })
  }

  return NextResponse.json({ success: true })
}
