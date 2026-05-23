import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import {
  canAccessProgramming,
  canAccessEnglish,
  canAccessOsis,
  canAccessMpk,
  isAdministrator
} from '@/lib/auth'
import { z } from 'zod'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

const pencapaianSchema = z.object({
  icon: z.string().min(1, 'Icon wajib diisi'),
  nama_pencapaian: z.string().min(1, 'Nama pencapaian wajib diisi'),
  deskripsi: z.string().min(1, 'Deskripsi wajib diisi'),
  exp_reward: z.number().min(0, 'EXP reward minimal 0'),
  organisasi: z.enum(['programming', 'english', 'osis', 'mpk']),
})

export async function GET(req: NextRequest) {
  const ctx = getCtx(req)
  const { searchParams } = new URL(req.url)
  const org = searchParams.get('organisasi') as 'programming' | 'english' | 'osis' | 'mpk' | null

  // Build accessible list
  const allowedOrgs: string[] = []
  if (canAccessProgramming(ctx.userRole)) allowedOrgs.push('programming')
  if (canAccessEnglish(ctx.userRole)) allowedOrgs.push('english')
  if (canAccessOsis(ctx.userRole)) allowedOrgs.push('osis')
  if (canAccessMpk(ctx.userRole)) allowedOrgs.push('mpk')

  let filterOrgs = allowedOrgs
  if (org) {
    if (!allowedOrgs.includes(org)) {
      return NextResponse.json({ error: 'Akses ditolak untuk organisasi ini' }, { status: 403 })
    }
    filterOrgs = [org]
  }

  try {
    const pencapaianList = await prisma.pencapaian.findMany({
      where: {
        organisasi: { in: filterOrgs as any }
      },
      orderBy: { created_at: 'desc' }
    })
    return NextResponse.json({ data: pencapaianList })
  } catch (error: any) {
    console.error('[GET PENCAPAIAN ERROR]', error)
    return NextResponse.json({ error: 'Gagal memuat pencapaian: ' + error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const ctx = getCtx(req)
  const body = await req.json()
  const parsed = pencapaianSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { icon, nama_pencapaian, deskripsi, exp_reward, organisasi } = parsed.data

  // Authorization checks
  if (organisasi === 'programming' && !canAccessProgramming(ctx.userRole)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }
  if (organisasi === 'english' && !canAccessEnglish(ctx.userRole)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }
  if (organisasi === 'osis' && !canAccessOsis(ctx.userRole)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }
  if (organisasi === 'mpk' && !canAccessMpk(ctx.userRole)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  try {
    const created = await prisma.pencapaian.create({
      data: {
        icon,
        nama_pencapaian,
        deskripsi,
        exp_reward,
        organisasi
      }
    })

    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'CREATE',
      tabel: 'pencapaian',
      recordId: created.id,
      deskripsi: `${ctx.userNama} membuat pencapaian baru: "${nama_pencapaian}" untuk ${organisasi.toUpperCase()} (+${exp_reward} EXP)`,
      dataBaru: created,
      ipAddress: getIp(req)
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error: any) {
    console.error('[CREATE PENCAPAIAN ERROR]', error)
    return NextResponse.json({ error: 'Gagal membuat pencapaian: ' + error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const ctx = getCtx(req)
  const body = await req.json()
  const { id, ...rest } = body

  if (!id) {
    return NextResponse.json({ error: 'ID Pencapaian required' }, { status: 400 })
  }

  const parsed = pencapaianSchema.safeParse(rest)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { icon, nama_pencapaian, deskripsi, exp_reward, organisasi } = parsed.data

  // Authorization checks
  if (organisasi === 'programming' && !canAccessProgramming(ctx.userRole)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }
  if (organisasi === 'english' && !canAccessEnglish(ctx.userRole)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }
  if (organisasi === 'osis' && !canAccessOsis(ctx.userRole)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }
  if (organisasi === 'mpk' && !canAccessMpk(ctx.userRole)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  try {
    const existing = await prisma.pencapaian.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Pencapaian tidak ditemukan' }, { status: 404 })
    }

    const updated = await prisma.pencapaian.update({
      where: { id },
      data: {
        icon,
        nama_pencapaian,
        deskripsi,
        exp_reward,
        organisasi
      }
    })

    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'UPDATE',
      tabel: 'pencapaian',
      recordId: id,
      deskripsi: `${ctx.userNama} memperbarui pencapaian: "${nama_pencapaian}"`,
      dataLama: existing,
      dataBaru: updated,
      ipAddress: getIp(req)
    })

    return NextResponse.json({ data: updated })
  } catch (error: any) {
    console.error('[UPDATE PENCAPAIAN ERROR]', error)
    return NextResponse.json({ error: 'Gagal memperbarui pencapaian: ' + error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const ctx = getCtx(req)
  const { searchParams } = new URL(req.url)
  const idStr = searchParams.get('id')

  if (!idStr) {
    return NextResponse.json({ error: 'ID Pencapaian required' }, { status: 400 })
  }

  const id = parseInt(idStr)

  try {
    const existing = await prisma.pencapaian.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Pencapaian tidak ditemukan' }, { status: 404 })
    }

    // Authorization checks
    const { organisasi } = existing
    if (organisasi === 'programming' && !canAccessProgramming(ctx.userRole)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }
    if (organisasi === 'english' && !canAccessEnglish(ctx.userRole)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }
    if (organisasi === 'osis' && !canAccessOsis(ctx.userRole)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }
    if (organisasi === 'mpk' && !canAccessMpk(ctx.userRole)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    await prisma.pencapaian.delete({ where: { id } })

    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'DELETE',
      tabel: 'pencapaian',
      recordId: id,
      deskripsi: `${ctx.userNama} menghapus pencapaian: "${existing.nama_pencapaian}"`,
      dataLama: existing,
      ipAddress: getIp(req)
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[DELETE PENCAPAIAN ERROR]', error)
    return NextResponse.json({ error: 'Gagal menghapus pencapaian: ' + error.message }, { status: 500 })
  }
}
