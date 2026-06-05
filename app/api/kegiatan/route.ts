import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { isAdministrator } from '@/lib/auth-shared'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tipe = searchParams.get('tipe')
    
    const activities = await prisma.kegiatan.findMany({
      where: tipe ? { tipe: tipe as any } : undefined,
      include: {
        _count: { select: { pengelompokan: true } }
      },
      orderBy: { created_at: 'desc' }
    })
    
    return NextResponse.json({ data: activities })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = getCtx(req)
    if (!isAdministrator(ctx.userRole)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await req.json()
    const { nama_kegiatan, tipe, tanggal } = body

    if (!nama_kegiatan || !tipe) {
      return NextResponse.json({ error: 'Nama kegiatan dan tipe wajib diisi' }, { status: 400 })
    }

    const activity = await prisma.kegiatan.create({
      data: {
        nama_kegiatan,
        tipe,
        tanggal: tanggal ? new Date(tanggal) : null
      }
    })

    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'CREATE',
      tabel: 'kegiatan',
      recordId: activity.id.toString(),
      deskripsi: `${ctx.userNama} membuat kegiatan baru: ${nama_kegiatan}`,
      dataBaru: activity,
      ipAddress: getIp(req)
    })

    return NextResponse.json({ data: activity })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = getCtx(req)
    if (!isAdministrator(ctx.userRole)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id') || '0')

    if (!id) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })

    const deleted = await prisma.kegiatan.delete({
      where: { id }
    })

    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'DELETE',
      tabel: 'kegiatan',
      recordId: id.toString(),
      deskripsi: `${ctx.userNama} menghapus kegiatan: ${deleted.nama_kegiatan}`,
      ipAddress: getIp(req)
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
