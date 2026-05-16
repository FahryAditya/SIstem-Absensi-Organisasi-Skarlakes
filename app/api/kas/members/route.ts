import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessibleOrgs } from '@/lib/auth-shared'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userRole: req.headers.get('x-user-role') || '',
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userRole } = getCtx(req)
    const { searchParams } = new URL(req.url)
    const org = searchParams.get('org') || ''

    const accessible = getAccessibleOrgs(userRole)
    if (!org || !accessible.includes(org)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    let results: any[] = []

    if (org === 'programming' || org === 'english') {
      results = await prisma.siswa.findMany({
        where: { ekskul: org as any },
        select: { id: true, nama: true, kelas: true },
        orderBy: { nama: 'asc' }
      })
    } else if (org === 'osis') {
      results = await prisma.anggotaOsis.findMany({
        select: { id: true, nama: true, kelas: true, jabatan: true },
        orderBy: { nama: 'asc' }
      })
    } else if (org === 'mpk') {
      results = await prisma.anggotaMpk.findMany({
        select: { id: true, nama: true, kelas: true, jabatan: true },
        orderBy: { nama: 'asc' }
      })
    }

    return NextResponse.json({
      data: results.map(r => ({
        id: r.id,
        nama: r.nama,
        kelas: r.kelas ? `${r.kelas}${r.jabatan ? ` (${r.jabatan})` : ''}` : (r.jabatan || '-')
      }))
    })
  } catch (e: any) {
    console.error('[KAS MEMBERS ERROR]', e)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
