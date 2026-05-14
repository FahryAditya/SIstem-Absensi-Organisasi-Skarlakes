import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { isAdministrator } from '@/lib/auth'
import { formatDateTime } from '@/lib/utils'
import { z } from 'zod'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

const overrideSchema = z.object({
  hasil_id: z.number().int().positive(),
  alasan: z.string().min(1, 'Alasan override wajib diisi'),
})

export async function POST(req: NextRequest) {
  const ctx = getCtx(req)
  if (!isAdministrator(ctx.userRole)) {
    return NextResponse.json({ error: 'Hanya Administrator yang dapat override hasil' }, { status: 403 })
  }

  const parsed = overrideSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const existing = await prisma.hasilWawancaraTable.findUnique({
    where: { id: parsed.data.hasil_id },
    include: { antrian: { include: { sesi: true } } },
  })
  if (!existing) return NextResponse.json({ error: 'Hasil wawancara tidak ditemukan' }, { status: 404 })
  if (existing.hasil === 'LOLOS' || existing.hasil === 'DITERIMA') {
    return NextResponse.json({ error: 'Kandidat sudah berstatus lolos' }, { status: 400 })
  }

  const now = new Date()
  const updated = await prisma.hasilWawancaraTable.update({
    where: { id: parsed.data.hasil_id },
    data: {
      hasil: 'LOLOS',
      override_by: ctx.userId,
      override_alasan: parsed.data.alasan.trim(),
      override_at: now,
    },
    include: { antrian: true, overrider: { select: { nama: true } } },
  })

  await createLog({
    userId: ctx.userId,
    userNama: ctx.userNama,
    aksi: 'UPDATE',
    tabel: 'hasil_wawancara',
    recordId: updated.id,
    deskripsi: `[OVERRIDE] ${ctx.userNama} mengubah hasil: Nama: ${existing.antrian.nama}; Sebelum: Tidak Lolos (${existing.persentase}%); Sesudah: Lolos; Alasan: ${parsed.data.alasan.trim()}; Waktu: ${formatDateTime(now)}`,
    dataLama: existing as any,
    dataBaru: updated as any,
    ipAddress: getIp(req),
  })

  return NextResponse.json({ data: updated })
}
