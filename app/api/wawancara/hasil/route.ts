import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { canAccessMpk, canAccessOsis, isAdministrator } from '@/lib/auth'
import { z } from 'zod'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

function canAccessInterview(role: string, org: string) {
  if (org === 'osis') return canAccessOsis(role)
  if (org === 'mpk') return canAccessMpk(role)
  return false
}

const resultSchema = z.object({
  antrian_id: z.number().int().positive(),
  keterangan: z.enum(['AKTIF', 'KURANG_AKTIF']),
  hasil: z.enum(['LOLOS', 'TIDAK_LOLOS']),
  persentase: z.number().min(1).max(100),
  catatan: z.string().nullable().optional(),
})

export async function POST(req: NextRequest) {
  const ctx = getCtx(req)
  const parsed = resultSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const antrian = await prisma.antrianWawancara.findUnique({
    where: { id: parsed.data.antrian_id },
    include: { sesi: true, hasil_wawancara: true },
  })
  if (!antrian) return NextResponse.json({ error: 'Peserta antrian tidak ditemukan' }, { status: 404 })
  if (!canAccessInterview(ctx.userRole, antrian.sesi.organisasi_type)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }
  if (antrian.sesi.status !== 'ACTIVE' && !isAdministrator(ctx.userRole)) {
    return NextResponse.json({ error: 'Sesi sudah terkunci' }, { status: 400 })
  }
  if (antrian.sesi.status === 'SELESAI' || antrian.sesi.status === 'DIBATALKAN') {
    return NextResponse.json({ error: 'Sesi sudah terkunci permanen' }, { status: 400 })
  }

  const result = await prisma.hasilWawancaraTable.upsert({
    where: { antrian_id: parsed.data.antrian_id },
    create: {
      antrian_id: parsed.data.antrian_id,
      interviewer_id: ctx.userId,
      keterangan: parsed.data.keterangan,
      hasil: parsed.data.hasil,
      persentase: parsed.data.persentase,
      catatan: parsed.data.catatan || undefined,
    },
    update: {
      interviewer_id: ctx.userId,
      keterangan: parsed.data.keterangan,
      hasil: parsed.data.hasil,
      persentase: parsed.data.persentase,
      catatan: parsed.data.catatan || undefined,
    },
  })

  await prisma.antrianWawancara.update({
    where: { id: parsed.data.antrian_id },
    data: { status: 'SELESAI_WAWANCARA' },
  })

  await createLog({
    userId: ctx.userId,
    userNama: ctx.userNama,
    aksi: antrian.hasil_wawancara ? 'UPDATE' : 'CREATE',
    tabel: 'hasil_wawancara',
    recordId: result.id,
    deskripsi: `${ctx.userNama} menginput hasil wawancara ${antrian.nama}`,
    dataBaru: result as any,
    ipAddress: getIp(req),
  })

  return NextResponse.json({ data: result })
}
