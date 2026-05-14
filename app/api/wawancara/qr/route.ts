import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { isAdministrator } from '@/lib/auth'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

async function cleanupExpiredQr() {
  await prisma.qrWawancara.deleteMany({
    where: { valid_until: { lt: new Date() } },
  })
}

export async function GET(req: NextRequest) {
  const ctx = getCtx(req)
  if (!isAdministrator(ctx.userRole)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  await cleanupExpiredQr()

  const data = await prisma.qrWawancara.findMany({
    include: {
      sesi: { select: { id: true, status: true, jadwal_mulai: true, jadwal_selesai: true } },
      creator: { select: { nama: true } },
      _count: { select: { antrian: true } },
    },
    orderBy: { created_at: 'desc' },
    take: 20,
  })

  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const ctx = getCtx(req)
  if (!isAdministrator(ctx.userRole)) {
    return NextResponse.json({ error: 'Hanya Administrator yang dapat membuat QR' }, { status: 403 })
  }

  await cleanupExpiredQr()

  const activeSession = await prisma.sesiWawancara.findFirst({
    where: { status: 'ACTIVE', organisasi_type: { in: ['osis', 'mpk'] } },
    orderBy: { created_at: 'desc' },
  })
  if (!activeSession) {
    return NextResponse.json({ error: 'Aktifkan sesi wawancara OSIS & MPK terlebih dahulu' }, { status: 400 })
  }

  await prisma.qrWawancara.updateMany({
    where: { sesi_id: activeSession.id, aktif: true },
    data: { aktif: false },
  })

  let body: any = {}
  try { body = await req.json() } catch {}
  
  const now = new Date()
  const validFrom = body.valid_from ? new Date(body.valid_from) : now
  const validUntil = body.valid_until ? new Date(body.valid_until) : new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const qr = await prisma.qrWawancara.create({
    data: {
      sesi_id: activeSession.id,
      token: crypto.randomBytes(24).toString('hex'),
      valid_from: validFrom,
      valid_until: validUntil,
      created_by: ctx.userId,
    },
  })

  await createLog({
    userId: ctx.userId,
    userNama: ctx.userNama,
    aksi: 'CREATE',
    tabel: 'qr_wawancara',
    recordId: qr.id,
    deskripsi: `${ctx.userNama} membuat QR absensi wawancara OSIS & MPK yang berlaku sampai ${validUntil.toLocaleString('id-ID')}`,
    dataBaru: qr as any,
    ipAddress: getIp(req),
  })

  return NextResponse.json({ data: qr }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const ctx = getCtx(req)
  if (!isAdministrator(ctx.userRole)) {
    return NextResponse.json({ error: 'Hanya Administrator yang dapat menghapus QR' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get('id') || '0')
  if (!id) return NextResponse.json({ error: 'ID QR wajib diisi' }, { status: 400 })

  const qr = await prisma.qrWawancara.findUnique({ where: { id } })
  if (!qr) return NextResponse.json({ error: 'QR tidak ditemukan' }, { status: 404 })

  await prisma.qrWawancara.delete({ where: { id } })

  await createLog({
    userId: ctx.userId,
    userNama: ctx.userNama,
    aksi: 'DELETE',
    tabel: 'qr_wawancara',
    recordId: id,
    deskripsi: `${ctx.userNama} menghapus QR absensi wawancara ID ${id}`,
    dataLama: qr as any,
    ipAddress: getIp(req),
  })

  return NextResponse.json({ success: true })
}
