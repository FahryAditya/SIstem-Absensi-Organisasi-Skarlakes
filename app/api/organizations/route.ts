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
