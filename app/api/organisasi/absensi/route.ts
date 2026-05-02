import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { canAccessOsis, canAccessMpk } from '@/lib/auth'
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
  const organisasi = searchParams.get('organisasi') as 'osis' | 'mpk' | null
  const tanggal = searchParams.get('tanggal')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  if (organisasi === 'osis' && !canAccessOsis(userRole))
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  if (organisasi === 'mpk' && !canAccessMpk(userRole))
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const accessible: string[] = []
  if (canAccessOsis(userRole)) accessible.push('osis')
  if (canAccessMpk(userRole)) accessible.push('mpk')

  const orgFilter = organisasi && accessible.includes(organisasi) ? [organisasi] : accessible

  const where: Record<string, unknown> = {
    organisasi_type: { in: orgFilter },
    ...(tanggal ? { tanggal: new Date(tanggal) } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.absensiOrganisasi.findMany({
      where,
      include: { anggota_osis: true, anggota_mpk: true },
      orderBy: [{ tanggal: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.absensiOrganisasi.count({ where }),
  ])

  return NextResponse.json({ data, total, totalPages: Math.ceil(total / limit) })
}

const bulkSchema = z.object({
  organisasi: z.enum(['osis', 'mpk']),
  tanggal: z.string(),
  rows: z.array(z.object({
    anggota_id: z.number(),
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

  const { organisasi, tanggal, rows } = parsed.data

  if (organisasi === 'osis' && !canAccessOsis(ctx.userRole))
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  if (organisasi === 'mpk' && !canAccessMpk(ctx.userRole))
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const tanggalDate = new Date(tanggal)
  const anggotaIds = rows.map(r => r.anggota_id)

  // Get existing
  const existing = await prisma.absensiOrganisasi.findMany({
    where: {
      organisasi_type: organisasi,
      tanggal: tanggalDate,
      ...(organisasi === 'osis'
        ? { anggota_osis_id: { in: anggotaIds } }
        : { anggota_mpk_id: { in: anggotaIds } }),
    }
  })

  // Upsert
  await Promise.all(rows.map(async row => {
    const ex = existing.find(e =>
      organisasi === 'osis' ? e.anggota_osis_id === row.anggota_id : e.anggota_mpk_id === row.anggota_id
    )

    const baseData = {
      organisasi_type: organisasi,
      tanggal: tanggalDate,
      status: row.status,
      uang_kas: row.uang_kas,
      keterangan: row.keterangan,
    }

    if (ex) {
      return prisma.absensiOrganisasi.update({
        where: { id: ex.id },
        data: { ...baseData, updated_by: ctx.userId }
      })
    } else {
      return prisma.absensiOrganisasi.create({
        data: {
          ...baseData,
          ...(organisasi === 'osis' ? { anggota_osis_id: row.anggota_id } : { anggota_mpk_id: row.anggota_id }),
          created_by: ctx.userId,
        }
      })
    }
  }))

  await createLog({
    userId: ctx.userId, userNama: ctx.userNama, aksi: 'UPDATE',
    tabel: `absensi_${organisasi}`, deskripsi: `${ctx.userNama} menyimpan absensi ${organisasi.toUpperCase()} tanggal ${tanggal} (${rows.length} anggota)`,
    dataBaru: { tanggal, organisasi, jumlah: rows.length }, ipAddress: getIp(req),
  })

  return NextResponse.json({ success: true, count: rows.length })
}
