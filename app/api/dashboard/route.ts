import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessibleOrgs } from '@/lib/auth'
import { format, subDays, startOfMonth, subMonths } from 'date-fns'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userRole: req.headers.get('x-user-role') || '',
  }
}

export async function GET(req: NextRequest) {
  const { userRole } = getCtx(req)
  const orgs = getAccessibleOrgs(userRole)
  const { searchParams } = new URL(req.url)
  const part = searchParams.get('part') || 'all'

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const start7 = subDays(today, 6)

  // Ekskul orgs (programming, english)
  const ekskulOrgs = orgs.filter(o => o === 'programming' || o === 'english') as ('programming' | 'english')[]
  // Organisasi orgs (osis, mpk)
  const orgOrgs = orgs.filter(o => o === 'osis' || o === 'mpk')

  const response: any = { orgs }

  if (part === 'all' || part === 'stats') {
    const [
      totalSiswaCount, // Programming + English
      totalProgramming,
      totalEnglish,
      totalOsis,
      totalMpk,
      hadirEkskulHariIni,
      hadirOrganisasiHariIni,
      kasEkskulTotal,
      kasOrgTotal,
      pengeluaranTotalData,
    ] = await Promise.all([
      prisma.siswa.count(), 
      prisma.siswa.count({ where: { ekskul: 'programming' } }),
      prisma.siswa.count({ where: { ekskul: 'english' } }),
      prisma.anggotaOsis.count(),
      prisma.anggotaMpk.count(),
      ekskulOrgs.length ? prisma.absensi.count({
        where: {
          tanggal: new Date(todayStr),
          status: 'hadir',
          siswa: { ekskul: { in: ekskulOrgs } }
        }
      }) : Promise.resolve(0),
      orgOrgs.length ? prisma.absensiOrganisasi.count({
        where: {
          tanggal: new Date(todayStr),
          status: 'hadir',
          organisasi_type: { in: orgOrgs as ('osis' | 'mpk')[] }
        }
      }) : Promise.resolve(0),
      // Sum instead of findMany for total kas (more efficient)
      ekskulOrgs.length ? prisma.absensi.aggregate({
        where: { siswa: { ekskul: { in: ekskulOrgs } } },
        _sum: { uang_kas: true }
      }) : Promise.resolve({ _sum: { uang_kas: 0 } }),
      orgOrgs.length ? prisma.absensiOrganisasi.aggregate({
        where: { organisasi_type: { in: orgOrgs as ('osis' | 'mpk')[] } },
        _sum: { uang_kas: true }
      }) : Promise.resolve({ _sum: { uang_kas: 0 } }),
      orgs.length ? (prisma as any).pengeluaranKas.aggregate({
        where: userRole !== 'administrator' ? { organisasi_type: { in: orgs as any[] } } : {},
        _sum: { nominal: true }
      }) : Promise.resolve({ _sum: { nominal: 0 } }),
    ])

    const totalPemasukan = (kasEkskulTotal._sum?.uang_kas || 0) + (kasOrgTotal._sum?.uang_kas || 0)
    const totalPengeluaran = pengeluaranTotalData._sum?.nominal || 0

    // Total Siswa Ekskul is now the sum of ALL organizations
    response.totalSiswa = totalSiswaCount + totalOsis + totalMpk
    response.totalProgramming = totalProgramming
    response.totalEnglish = totalEnglish
    response.totalOsis = totalOsis
    response.totalMpk = totalMpk
    response.hadirHariIni = hadirEkskulHariIni + hadirOrganisasiHariIni
    response.totalPemasukan = totalPemasukan
    response.totalPengeluaran = totalPengeluaran
    response.totalKas = totalPemasukan - totalPengeluaran
  }

  if (part === 'all' || part === 'charts') {
    const [
      absensiMingguEkskul,
      kasEkskulBulanan,
      kasOrgBulanan,
      pengeluaranBulanan,
    ] = await Promise.all([
      ekskulOrgs.length ? prisma.absensi.findMany({
        where: {
          tanggal: { gte: start7 },
          siswa: { ekskul: { in: ekskulOrgs } }
        },
        select: { tanggal: true, status: true }
      }) : Promise.resolve([]),
      ekskulOrgs.length ? prisma.absensi.findMany({
        where: {
          tanggal: { gte: subMonths(startOfMonth(today), 5) },
          siswa: { ekskul: { in: ekskulOrgs } }
        },
        select: { tanggal: true, uang_kas: true }
      }) : Promise.resolve([]),
      orgOrgs.length ? prisma.absensiOrganisasi.findMany({
        where: {
          tanggal: { gte: subMonths(startOfMonth(today), 5) },
          organisasi_type: { in: orgOrgs as ('osis' | 'mpk')[] }
        },
        select: { tanggal: true, uang_kas: true }
      }) : Promise.resolve([]),
      orgs.length ? (prisma as any).pengeluaranKas.findMany({
        where: {
          tanggal: { gte: subMonths(startOfMonth(today), 5) },
          ...(userRole !== 'administrator' ? { organisasi_type: { in: orgs as any[] } } : {})
        },
        select: { tanggal: true, nominal: true }
      }) : Promise.resolve([]),
    ])

    // Process minggu kehadiran
    response.kehadiranMingguan = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i)
      const dStr = format(d, 'yyyy-MM-dd')
      const dayRecords = (absensiMingguEkskul as { tanggal: Date; status: string }[]).filter(
        a => format(a.tanggal, 'yyyy-MM-dd') === dStr
      )
      return {
        day: format(d, 'EEE'),
        hadir: dayRecords.filter(r => r.status === 'hadir').length,
        tidak_hadir: dayRecords.filter(r => r.status !== 'hadir').length,
      }
    })

    // Process kas per bulan
    const months = Array.from({ length: 6 }, (_, i) => subMonths(today, 5 - i))
    response.kasPerBulan = months.map(m => {
      const mStr = format(m, 'yyyy-MM')
      const ekskulTotal = (kasEkskulBulanan as { tanggal: Date; uang_kas: number }[])
        .filter(a => format(a.tanggal, 'yyyy-MM') === mStr)
        .reduce((s, a) => s + (a.uang_kas || 0), 0)
      const orgTotal = (kasOrgBulanan as { tanggal: Date; uang_kas: number }[])
        .filter(a => format(a.tanggal, 'yyyy-MM') === mStr)
        .reduce((s, a) => s + (a.uang_kas || 0), 0)
      const pengeluaranTotal = (pengeluaranBulanan as { tanggal: Date; nominal: number }[])
        .filter(a => format(a.tanggal, 'yyyy-MM') === mStr)
        .reduce((s, a) => s + (a.nominal || 0), 0)
      return { bulan: format(m, 'MMM'), total: ekskulTotal + orgTotal - pengeluaranTotal }
    })
  }

  if (part === 'all' || part === 'logs') {
    if (userRole === 'administrator') {
      response.recentLog = await prisma.logAktivitas.findMany({
        orderBy: { created_at: 'desc' },
        take: 5,
      })
    } else {
      response.recentLog = []
    }
  }

  return NextResponse.json(response)
}
