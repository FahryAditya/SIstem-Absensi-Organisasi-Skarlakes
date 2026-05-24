import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessibleOrgs } from '@/lib/auth-shared'

function getCtx(req: NextRequest) {
  return { userRole: req.headers.get('x-user-role') || '' }
}

export async function GET(req: NextRequest) {
  const { userRole } = getCtx(req)
  const { searchParams } = new URL(req.url)
  const tipe = searchParams.get('tipe') || 'siswa'   // 'siswa' | 'osis' | 'mpk'
  const targetId = parseInt(searchParams.get('id') || '0')
  const ekskul = searchParams.get('ekskul') as 'programming' | 'english' | null

  if (!targetId) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  if (tipe === 'siswa') {
    const accessible = getAccessibleOrgs(userRole)
    if (ekskul && !accessible.includes(ekskul))
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

    const [absensiList, siswa] = await Promise.all([
      prisma.absensi.findMany({
        where: { siswa_id: targetId },
        select: { tanggal: true, status: true },
        orderBy: { tanggal: 'asc' },
      }),
      prisma.siswa.findUnique({
        where: { id: targetId },
        select: { id: true, nama: true, kelas: true, ekskul: true, xp: true, level: true },
      }),
    ])

    if (!siswa) return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })

    const stats = hitungStatistik(absensiList)
    return NextResponse.json({ data: { ...siswa, ...stats } })
  }

  if (tipe === 'osis') {
    const accessible = getAccessibleOrgs(userRole)
    if (!accessible.includes('osis')) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    const [absensiList, anggota] = await Promise.all([
      prisma.absensiOrganisasi.findMany({
        where: { anggota_osis_id: targetId },
        select: { tanggal: true, status: true },
        orderBy: { tanggal: 'asc' },
      }),
      prisma.anggotaOsis.findUnique({
        where: { id: targetId },
        select: { id: true, nama: true, kelas: true, jabatan: true, xp: true, level: true },
      }),
    ])
    if (!anggota) return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 })
    const stats = hitungStatistik(absensiList)
    return NextResponse.json({ data: { ...anggota, ...stats } })
  }

  if (tipe === 'mpk') {
    const accessible = getAccessibleOrgs(userRole)
    if (!accessible.includes('mpk')) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    const [absensiList, anggota] = await Promise.all([
      prisma.absensiOrganisasi.findMany({
        where: { anggota_mpk_id: targetId },
        select: { tanggal: true, status: true },
        orderBy: { tanggal: 'asc' },
      }),
      prisma.anggotaMpk.findUnique({
        where: { id: targetId },
        select: { id: true, nama: true, kelas: true, jabatan: true, xp: true, level: true },
      }),
    ])
    if (!anggota) return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 })
    const stats = hitungStatistik(absensiList)
    return NextResponse.json({ data: { ...anggota, ...stats } })
  }

  return NextResponse.json({ error: 'Tipe tidak valid' }, { status: 400 })
}

function hitungStatistik(absensiList: { tanggal: Date; status: string }[]) {
  const bulanIni = new Date()
  bulanIni.setDate(1)
  bulanIni.setHours(0, 0, 0, 0)

  const hadirBulanIni = absensiList.filter(
    (a) => a.status === 'hadir' && new Date(a.tanggal) >= bulanIni
  ).length
  const totalBulanIni = absensiList.filter((a) => new Date(a.tanggal) >= bulanIni).length
  const persentaseKehadiran = totalBulanIni > 0 ? Math.round((hadirBulanIni / totalBulanIni) * 100) : 0

  // Hitung streak berturut-turut (dari tanggal terbaru ke belakang)
  const sorted = [...absensiList].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
  let streak = 0
  for (const a of sorted) {
    if (a.status === 'hadir') streak++
    else break
  }

  // Grafik per bulan (6 bulan terakhir)
  const grafikMap: Record<string, { hadir: number; total: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    grafikMap[key] = { hadir: 0, total: 0 }
  }
  for (const a of absensiList) {
    const d = new Date(a.tanggal)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (grafikMap[key]) {
      grafikMap[key].total++
      if (a.status === 'hadir') grafikMap[key].hadir++
    }
  }

  const grafik = Object.entries(grafikMap).map(([bulan, v]) => ({
    bulan,
    hadir: v.hadir,
    total: v.total,
    persen: v.total > 0 ? Math.round((v.hadir / v.total) * 100) : 0,
  }))

  return {
    hadirBulanIni,
    totalBulanIni,
    persentaseKehadiran,
    streak,
    grafik,
    riwayat: absensiList.map((a) => ({ tanggal: a.tanggal, status: a.status })),
  }
}
