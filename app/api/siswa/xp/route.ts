import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { canAccessProgramming, canAccessEnglish } from '@/lib/auth'
import { updateExp } from '@/lib/exp'
import { z } from 'zod'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

const awardXpSchema = z.object({
  siswaId: z.number(),
  xpToAdd: z.number(),
  activity: z.enum(['tugas', 'proyek', 'aktif', 'prestasi', 'manual']),
})

const activityLabels: Record<string, string> = {
  tugas: 'Kumpul tugas tepat waktu',
  proyek: 'Publikasi proyek baru',
  aktif: 'Aktif di pertemuan',
  prestasi: 'Juara lomba / prestasi',
  manual: 'Penghargaan manual admin',
}

export async function POST(req: NextRequest) {
  const ctx = getCtx(req)
  const body = await req.json()
  const parsed = awardXpSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { siswaId, xpToAdd, activity } = parsed.data

  const siswa = await prisma.siswa.findUnique({ where: { id: siswaId } })
  if (!siswa) {
    return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })
  }

  if (siswa.ekskul === 'programming' && !canAccessProgramming(ctx.userRole)) {
    return NextResponse.json({ error: 'Akses ditolak untuk ekskul Programming' }, { status: 403 })
  }
  if (siswa.ekskul === 'english' && !canAccessEnglish(ctx.userRole)) {
    return NextResponse.json({ error: 'Akses ditolak untuk ekskul English' }, { status: 403 })
  }

  try {
    const result = await updateExp({
      tipeAnggota: 'siswa',
      targetId: siswaId,
      selisih: xpToAdd,
      alasan: activityLabels[activity] ?? activity,
      adminId: ctx.userId,
      organisasi: siswa.ekskul,
    })

    const description = `${ctx.userNama} memberikan ${xpToAdd > 0 ? '+' : ''}${xpToAdd} EXP kepada "${siswa.nama}" untuk ${activityLabels[activity] ?? activity}`

    await createLog({
      userId: ctx.userId, userNama: ctx.userNama, aksi: 'UPDATE',
      tabel: 'siswa', recordId: siswaId,
      deskripsi: description,
      dataLama: { xp: result.xpBaru - xpToAdd, level: result.levelLama },
      dataBaru: { xp: result.xpBaru, level: result.levelBaru },
      ipAddress: getIp(req),
    })

    return NextResponse.json({ success: true, xp: result.xpBaru, level: result.levelBaru, levelNaik: result.levelNaik })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[AWARD XP ERROR]', error)
    return NextResponse.json({ error: 'Gagal memberikan EXP: ' + msg }, { status: 500 })
  }
}
