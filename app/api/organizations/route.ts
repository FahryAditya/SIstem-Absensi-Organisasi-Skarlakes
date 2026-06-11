import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const orgs = await prisma.organization.findMany({
      include: {
        _count: {
          select: { members: true }
        }
      },
      orderBy: { created_at: 'desc' }
    })
    return NextResponse.json({ success: true, data: orgs })
  } catch (error) {
    console.error('Fetch orgs error:', error)
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { nama, category, school_origin, status } = await req.json()

    if (!nama || !category || !school_origin) {
      return NextResponse.json({ error: 'Nama, kategori, dan asal sekolah wajib diisi' }, { status: 400 })
    }

    // Generate slug from nama
    const slug = nama.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')

    const org = await prisma.organization.create({
      data: {
        nama,
        slug,
        category,
        school_origin,
        status: status || 'Aktif',
      }
    })

    return NextResponse.json({ success: true, data: org })
  } catch (error: any) {
    console.error('Create org error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Organisasi dengan nama/slug ini sudah ada' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, nama, deskripsi, hari_pertemuan, waktu_mulai, waktu_selesai, lokasi, school_origin, status } = body

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const updateData: any = {}
    if (nama !== undefined) updateData.nama = nama
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi
    if (hari_pertemuan !== undefined) updateData.hari_pertemuan = hari_pertemuan
    if (waktu_mulai !== undefined) updateData.waktu_mulai = waktu_mulai
    if (waktu_selesai !== undefined) updateData.waktu_selesai = waktu_selesai
    if (lokasi !== undefined) updateData.lokasi = lokasi
    if (school_origin !== undefined) updateData.school_origin = school_origin
    if (status !== undefined) updateData.status = status

    const org = await prisma.organization.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ success: true, data: org })
  } catch (error: any) {
    console.error('Update org error:', error)
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
  }
}
