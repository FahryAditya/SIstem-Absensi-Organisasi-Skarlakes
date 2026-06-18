import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function isSuperAdmin(role: string) {
  return role === 'SUPER_ADMIN' || role === 'administrator' || role === 'admin_osis_mpk'
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const targetId = parseInt(searchParams.get('id') || '0')

    if (!targetId) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const member = await prisma.member.findUnique({
      where: { id: targetId },
      include: { organization: { select: { nama: true, slug: true } } }
    })

    if (!member) return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 })

    // RBAC Check: Ensure admin has access to this member's organization
    if (!isSuperAdmin(session.role as string) && !session.orgIds.includes(member.organization_id)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const absensiList = await prisma.attendance.findMany({
      where: { member_id: targetId },
      select: { date: true, status: true },
      orderBy: { date: 'asc' },
    })

    const stats = hitungStatistik(absensiList)
    
    return NextResponse.json({ 
      data: { 
        id: member.id,
        nama: member.name,
        kelas: member.class,
        jabatan: member.jabatan,
        xp: member.exp,
        level: member.level,
        organisasi: member.organization.nama,
        ...stats 
      } 
    })
  } catch (error) {
    console.error('[REKAP ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

function hitungStatistik(absensiList: { date: Date; status: string }[]) {
  const bulanIni = new Date()
  bulanIni.setDate(1)
  bulanIni.setHours(0, 0, 0, 0)

  const hadirBulanIni = absensiList.filter(
    (a) => a.status === 'hadir' && new Date(a.date) >= bulanIni
  ).length
  const totalBulanIni = absensiList.filter((a) => new Date(a.date) >= bulanIni).length
  const persentaseKehadiran = totalBulanIni > 0 ? Math.round((hadirBulanIni / totalBulanIni) * 100) : 0

  // Hitung streak berturut-turut (dari tanggal terbaru ke belakang)
  const sorted = [...absensiList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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
    const d = new Date(a.date)
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
    riwayat: absensiList.map((a) => ({ tanggal: a.date, status: a.status })),
  }
}
