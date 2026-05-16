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
      // OPTIMIZATION: Use groupBy to reduce memory usage (fetches counts per day/status instead of thousands of records)
      ekskulOrgs.length ? prisma.absensi.groupBy({
        by: ['tanggal', 'status'],
        where: {
          tanggal: { gte: start7 },
          siswa: { ekskul: { in: ekskulOrgs } }
        },
        _count: { _all: true }
      }) : Promise.resolve([]),
      
      // OPTIMIZATION: Group by day and sum kas to avoid loading every record
      ekskulOrgs.length ? prisma.absensi.groupBy({
        by: ['tanggal'],
        where: {
          tanggal: { gte: subMonths(startOfMonth(today), 5) },
          siswa: { ekskul: { in: ekskulOrgs } }
        },
        _sum: { uang_kas: true }
      }) : Promise.resolve([]),

      orgOrgs.length ? prisma.absensiOrganisasi.groupBy({
        by: ['tanggal'],
        where: {
          tanggal: { gte: subMonths(startOfMonth(today), 5) },
          organisasi_type: { in: orgOrgs as ('osis' | 'mpk')[] }
        },
        _sum: { uang_kas: true }
      }) : Promise.resolve([]),

      // Expenditure table is usually small, but still filter strictly
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
      
      // Filter from the already small grouped array
      const dayStats = (absensiMingguEkskul as any[]).filter(
        a => format(a.tanggal, 'yyyy-MM-dd') === dStr
      )
      
      return {
        day: format(d, 'EEE'),
        hadir: dayStats.find(s => s.status === 'hadir')?._count?._all || 0,
        tidak_hadir: dayStats.find(s => s.status !== 'hadir' && s.status !== 'kas_saja')?._count?._all || 0,
      }
    })

    // Process kas per bulan
    const months = Array.from({ length: 6 }, (_, i) => subMonths(today, 5 - i))
    response.kasPerBulan = months.map(m => {
      const mStr = format(m, 'yyyy-MM')
      
      const ekskulTotal = (kasEkskulBulanan as any[])
        .filter(a => format(a.tanggal, 'yyyy-MM') === mStr)
        .reduce((s, a) => s + (a._sum?.uang_kas || 0), 0)
        
      const orgTotal = (kasOrgBulanan as any[])
        .filter(a => format(a.tanggal, 'yyyy-MM') === mStr)
        .reduce((s, a) => s + (a._sum?.uang_kas || 0), 0)
        
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
        select: { id: true, user_nama: true, deskripsi: true, created_at: true, aksi: true } // Limit columns
      })
    } else {
      response.recentLog = []
    }
  }

  // ─── Request Statistics (administrator only) ─────────────────────────────────
  if ((part === 'request_stats') && userRole === 'administrator') {
    const since30 = subDays(new Date(), 29)

    // 1) Total per aksi (all time summary)
    const totalPerAksi = await prisma.logAktivitas.groupBy({
      by: ['aksi'],
      _count: { _all: true },
    })

    // 2) Daily breakdown for last 30 days (grouped by date + aksi)
    const dailyRaw = await prisma.logAktivitas.groupBy({
      by: ['aksi', 'created_at'],
      where: { created_at: { gte: since30 } },
      _count: { _all: true },
      orderBy: { created_at: 'asc' },
    })

    // Summarize daily: { date: 'yyyy-MM-dd', CREATE: n, UPDATE: n, DELETE: n, LOGIN: n, LOGOUT: n }
    const dayMap: Record<string, Record<string, number>> = {}
    for (const row of dailyRaw) {
      const d = format(row.created_at, 'yyyy-MM-dd')
      if (!dayMap[d]) dayMap[d] = {}
      dayMap[d][row.aksi] = (dayMap[d][row.aksi] || 0) + (row._count._all as number)
    }

    // Fill last 30 days (ensure no gap)
    const AKSI_TYPES = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT']
    const daily30 = Array.from({ length: 30 }, (_, i) => {
      const d = subDays(new Date(), 29 - i)
      const key = format(d, 'yyyy-MM-dd')
      const entry: Record<string, any> = { date: key, label: format(d, 'dd/MM') }
      for (const a of AKSI_TYPES) entry[a] = dayMap[key]?.[a] || 0
      return entry
    })

    // 3) Total grand
    const grandTotal = totalPerAksi.reduce((s, r) => s + (r._count._all as number), 0)

    // 4) Request-method mapping (AksiLog → HTTP verb semantics)
    const METHOD_MAP: Record<string, string> = {
      CREATE: 'POST',
      UPDATE: 'PUT',
      DELETE: 'DELETE',
      LOGIN:  'GET',
      LOGOUT: 'GET',
    }

    response.requestStats = {
      grandTotal,
      perAksi: totalPerAksi.map(r => ({
        aksi: r.aksi,
        method: METHOD_MAP[r.aksi] || 'GET',
        count: r._count._all,
      })),
      daily30,
    }
  }

  return NextResponse.json(response)
}
