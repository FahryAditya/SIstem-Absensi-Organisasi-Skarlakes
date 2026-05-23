import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { updateExp } from '@/lib/exp'
import { isAdministrator } from '@/lib/auth'
import { z } from 'zod'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

const postSchema = z.object({
  tipe_anggota: z.enum(['siswa', 'anggota_osis', 'anggota_mpk']),
  target_id: z.number().int().positive(),
  selisih: z.number().int().refine((n) => n !== 0, 'Selisih tidak boleh 0'),
  alasan: z.string().min(3, 'Alasan minimal 3 karakter').max(500),
  organisasi: z.enum(['programming', 'english', 'osis', 'mpk']),
})

// GET: Riwayat exp_log (filter by tipe + id, atau semua)
export async function GET(req: NextRequest) {
  const { userRole } = getCtx(req)
  if (!isAdministrator(userRole)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const tipeAnggota = searchParams.get('tipe_anggota')
  const targetId = searchParams.get('target_id')
  const organisasi = searchParams.get('organisasi')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where: Record<string, unknown> = {}
  if (tipeAnggota) where.tipe_anggota = tipeAnggota
  if (organisasi) where.organisasi = organisasi
  if (targetId) {
    const tid = parseInt(targetId)
    if (tipeAnggota === 'siswa') where.siswa_id = tid
    else if (tipeAnggota === 'anggota_osis') where.anggota_osis_id = tid
    else if (tipeAnggota === 'anggota_mpk') where.anggota_mpk_id = tid
  }

  const [data, total] = await Promise.all([
    prisma.expLog.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.expLog.count({ where }),
  ])

  return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
}

// POST: Admin tambah/kurangi EXP manual
export async function POST(req: NextRequest) {
  const ctx = getCtx(req)
  if (!isAdministrator(ctx.userRole)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { tipe_anggota, target_id, selisih, alasan, organisasi } = parsed.data

    const result = await updateExp({
      tipeAnggota: tipe_anggota,
      targetId: target_id,
      selisih,
      alasan: `[Manual Admin] ${alasan}`,
      adminId: ctx.userId,
      organisasi,
    })

    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'UPDATE',
      tabel: tipe_anggota,
      recordId: target_id,
      deskripsi: `${ctx.userNama} mengubah EXP ${tipe_anggota} #${target_id} sebesar ${selisih > 0 ? '+' : ''}${selisih} EXP. Alasan: ${alasan}`,
      dataLama: { xp: result.xpBaru - selisih, level: result.levelLama },
      dataBaru: { xp: result.xpBaru, level: result.levelBaru },
      ipAddress: getIp(req),
    })

    return NextResponse.json({
      success: true,
      xpBaru: result.xpBaru,
      levelBaru: result.levelBaru,
      levelNaik: result.levelNaik,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[EXP POST ERROR]', error)
    return NextResponse.json({ error: 'Gagal update EXP: ' + msg }, { status: 500 })
  }
}
