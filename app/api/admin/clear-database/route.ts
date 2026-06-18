import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { z } from 'zod'
import { getSessionFromRequest } from '@/lib/auth'

const clearSchema = z.object({
  orgId: z.number().int().positive(),
  tipe: z.enum(['absensi', 'kas', 'anggota', 'semua']),
  konfirmasi: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = clearSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { orgId, tipe, konfirmasi } = parsed.data
    
    const org = await prisma.organization.findUnique({ where: { id: orgId } })
    if (!org) return NextResponse.json({ error: 'Organisasi tidak ditemukan' }, { status: 404 })

    if (konfirmasi !== `HAPUS ${org.nama.toUpperCase()}`) {
      return NextResponse.json({ error: `Ketik "HAPUS ${org.nama.toUpperCase()}" untuk konfirmasi` }, { status: 400 })
    }

    const result: Record<string, number> = {}

    if (tipe === 'absensi') {
      const res = await prisma.attendance.deleteMany({ where: { organization_id: orgId } })
      result.absensi = res.count
    } else if (tipe === 'kas') {
      const res = await prisma.cashTransaction.deleteMany({ where: { organization_id: orgId } })
      result.kas = res.count
      // Also reset cash_amount in attendance
      await prisma.attendance.updateMany({
        where: { organization_id: orgId },
        data: { cash_amount: 0 }
      })
    } else if (tipe === 'anggota') {
      const res = await prisma.member.deleteMany({ where: { organization_id: orgId } })
      result.anggota = res.count
    } else {
      // 'semua'
      const [abs, kas, mem] = await prisma.$transaction([
        prisma.attendance.deleteMany({ where: { organization_id: orgId } }),
        prisma.cashTransaction.deleteMany({ where: { organization_id: orgId } }),
        prisma.member.deleteMany({ where: { organization_id: orgId } }),
      ])
      result.absensi = abs.count
      result.kas = kas.count
      result.anggota = mem.count
    }

    await createLog({
      userId: session.id,
      userNama: session.nama,
      aksi: 'DELETE',
      organizationId: orgId,
      tabel: 'organizations',
      deskripsi: `${session.nama} membersihkan data [${tipe}] untuk organisasi ${org.nama}`,
      dataBaru: result,
      ipAddress: getIp(req),
    })

    return NextResponse.json({ success: true, result })
  } catch (err) {
    console.error('Clear database error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan saat membersihkan database' }, { status: 500 })
  }
}
