import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { isAdministrator } from '@/lib/auth-shared'
import { z } from 'zod'

const cleanupSchema = z.object({
  tipe: z.enum(['sesi', 'chat']),
  konfirmasi: z.string().min(1),
})

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = getCtx(req)
    if (!isAdministrator(ctx.userRole)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = cleanupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { tipe, konfirmasi } = parsed.data
    if (konfirmasi !== 'HAPUS PERMANEN') {
      return NextResponse.json({ error: 'Ketik HAPUS PERMANEN untuk konfirmasi' }, { status: 400 })
    }

    let resultCount = 0

    if (tipe === 'sesi') {
      // Hapus Sesi Wawancara (Cascade will handle antrian, hasil, qr, chat)
      const deleted = await prisma.sesiWawancara.deleteMany()
      resultCount = deleted.count
    } else if (tipe === 'chat') {
      // Hanya hapus Chat Wawancara
      const deleted = await prisma.chatWawancara.deleteMany()
      resultCount = deleted.count
    }

    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'DELETE',
      tabel: tipe === 'sesi' ? 'sesi_wawancara' : 'chat_wawancara',
      deskripsi: `${ctx.userNama} membersihkan data wawancara: ${tipe === 'sesi' ? 'Semua Sesi & Hasil' : 'Semua Chat'}`,
      dataBaru: { tipe, deleted_count: resultCount },
      ipAddress: getIp(req),
    })

    return NextResponse.json({ success: true, count: resultCount })
  } catch (err: any) {
    console.error('Cleanup interview error:', err)
    return NextResponse.json({ error: 'Gagal membersihkan data: ' + err.message }, { status: 500 })
  }
}
