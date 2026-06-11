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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })

    const pengelompokan = await prisma.pengelompokanKegiatan.findMany({
      where: { kegiatan_id: id },
      include: {
        siswa: {
          select: {
            id: true,
            nama: true,
            kelas: true
          }
        }
      },
      orderBy: [
        { sub_kategori: 'asc' },
        { siswa: { nama: 'asc' } }
      ]
    })

    return NextResponse.json({ data: pengelompokan })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = getCtx(req)
    if (!isAdministrator(ctx.userRole) && ctx.userRole !== 'admin_osis_mpk') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const kegiatan_id = parseInt(params.id)
    const body = await req.json()
    const { siswa_id, organisasi, sub_kategori } = body

    if (!siswa_id || !organisasi) {
      return NextResponse.json({ error: 'Siswa dan organisasi wajib diisi' }, { status: 400 })
    }

    const entry = await prisma.pengelompokanKegiatan.create({
      data: {
        kegiatan_id,
        siswa_id,
        organisasi,
        sub_kategori
      },
      include: {
        siswa: { select: { nama: true } },
        kegiatan: { select: { nama_kegiatan: true } }
      }
    })

    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'CREATE',
      tabel: 'pengelompokan_kegiatan',
      recordId: entry.id.toString(),
      deskripsi: `${ctx.userNama} menambahkan ${entry.siswa.nama} ke kegiatan ${entry.kegiatan.nama_kegiatan} (${organisasi})`,
      dataBaru: entry,
      ipAddress: getIp(req)
    })

    return NextResponse.json({ data: entry })
  } catch (err: any) {
    console.error('[CREATE GROUPING ERROR]', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = getCtx(req)
    if (!isAdministrator(ctx.userRole) && ctx.userRole !== 'admin_osis_mpk') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id') || '0')

    if (!id) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })

    const deleted = await prisma.pengelompokanKegiatan.delete({
      where: { id },
      include: {
        siswa: { select: { nama: true } },
        kegiatan: { select: { nama_kegiatan: true } }
      }
    })

    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'DELETE',
      tabel: 'pengelompokan_kegiatan',
      recordId: id.toString(),
      deskripsi: `${ctx.userNama} menghapus ${deleted.siswa.nama} dari kegiatan ${deleted.kegiatan.nama_kegiatan}`,
      ipAddress: getIp(req)
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
