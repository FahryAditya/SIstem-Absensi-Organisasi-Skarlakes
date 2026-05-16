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
    const orgFilter = searchParams.get('org') || ''
    const searchQuery = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const accessible = getAccessibleOrgs(userRole)
    const org = (orgFilter && accessible.includes(orgFilter)) ? orgFilter : accessible[0]

    if (!org) {
      return NextResponse.json({ data: [], totalKas: 0, orgs: [], total: 0, totalPages: 0 })
    }

    let results: any[] = []
    let totalItems = 0
    let totalKasSum = 0

    const searchCondition = searchQuery ? { nama: { contains: searchQuery, mode: 'insensitive' as any } } : {}

    if (org === 'programming' || org === 'english') {
      const [siswaList, total, totalKasData] = await Promise.all([
        prisma.siswa.findMany({
          where: { ekskul: org, ...searchCondition },
          include: { absensi: { select: { uang_kas: true, updated_at: true } } },
          orderBy: { nama: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.siswa.count({ where: { ekskul: org, ...searchCondition } }),
        prisma.absensi.aggregate({
          where: { siswa: { ekskul: org } },
          _sum: { uang_kas: true }
        })
      ])

      totalItems = total
      totalKasSum = totalKasData._sum?.uang_kas || 0
      results = siswaList.map(s => {
        let terakhir_bayar = null
        const paidAbsensi = s.absensi.filter((a: any) => a.uang_kas !== 0)
        if (paidAbsensi.length > 0) {
          const latest = paidAbsensi.reduce((a: any, b: any) => new Date(a.updated_at) > new Date(b.updated_at) ? a : b)
          terakhir_bayar = latest.updated_at.toISOString()
        }
        return {
          id: s.id,
          nama: s.nama,
          kelas: s.kelas || '-',
          total_kas: s.absensi.reduce((sum: number, a: any) => sum + (a.uang_kas || 0), 0),
          terakhir_bayar
        }
      })
    } else if (org === 'osis') {
      const [anggotaList, total, totalKasData] = await Promise.all([
        prisma.anggotaOsis.findMany({
          where: searchCondition,
          include: { absensi: { select: { uang_kas: true, updated_at: true } } },
          orderBy: { nama: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.anggotaOsis.count({ where: searchCondition }),
        prisma.absensiOrganisasi.aggregate({
          where: { organisasi_type: 'osis' },
          _sum: { uang_kas: true }
        })
      ])

      totalItems = total
      totalKasSum = totalKasData._sum?.uang_kas || 0
      results = anggotaList.map(a => {
        let terakhir_bayar = null
        const paidAbsensi = a.absensi.filter((ab: any) => ab.uang_kas !== 0)
        if (paidAbsensi.length > 0) {
          const latest = paidAbsensi.reduce((ab1: any, ab2: any) => new Date(ab1.updated_at) > new Date(ab2.updated_at) ? ab1 : ab2)
          terakhir_bayar = latest.updated_at.toISOString()
        }
        return {
          id: a.id,
          nama: a.nama,
          kelas: a.kelas ? `${a.kelas} ${a.jabatan ? `(${a.jabatan})` : ''}` : (a.jabatan || '-'),
          total_kas: a.absensi.reduce((sum: number, ab: any) => sum + (ab.uang_kas || 0), 0),
          terakhir_bayar
        }
      })
    } else if (org === 'mpk') {
      const [anggotaList, total, totalKasData] = await Promise.all([
        prisma.anggotaMpk.findMany({
          where: searchCondition,
          include: { absensi: { select: { uang_kas: true, updated_at: true } } },
          orderBy: { nama: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.anggotaMpk.count({ where: searchCondition }),
        prisma.absensiOrganisasi.aggregate({
          where: { organisasi_type: 'mpk' },
          _sum: { uang_kas: true }
        })
      ])

      totalItems = total
      totalKasSum = totalKasData._sum?.uang_kas || 0
      results = anggotaList.map(a => {
        let terakhir_bayar = null
        const paidAbsensi = a.absensi.filter((ab: any) => ab.uang_kas !== 0)
        if (paidAbsensi.length > 0) {
          const latest = paidAbsensi.reduce((ab1: any, ab2: any) => new Date(ab1.updated_at) > new Date(ab2.updated_at) ? ab1 : ab2)
          terakhir_bayar = latest.updated_at.toISOString()
        }
        return {
          id: a.id,
          nama: a.nama,
          kelas: a.kelas ? `${a.kelas} ${a.jabatan ? `(${a.jabatan})` : ''}` : (a.jabatan || '-'),
          total_kas: a.absensi.reduce((sum: number, ab: any) => sum + (ab.uang_kas || 0), 0),
          terakhir_bayar
        }
      })
    }

    return NextResponse.json({
      data: results,
      totalKas: totalKasSum,
      orgs: accessible,
      activeOrg: org,
      total: totalItems,
      totalPages: Math.ceil(totalItems / limit)
    })
  } catch (e: any) {
    console.error('[KAS ERROR]', e)
    return NextResponse.json({ error: 'Terjadi kesalahan server saat memuat data kas' }, { status: 500 })
  }
}
