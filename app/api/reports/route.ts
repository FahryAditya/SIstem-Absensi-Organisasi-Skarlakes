import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessibleOrgs } from '@/lib/auth'
import { format, subDays, startOfMonth, subMonths, startOfYear } from 'date-fns'

export const dynamic = 'force-dynamic'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userRole: req.headers.get('x-user-role') || '',
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userRole } = getCtx(req)
    const orgs = getAccessibleOrgs(userRole)
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'all'

    if (orgs.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')
    const start7 = subDays(today, 6)
    const start30 = subDays(today, 29)
    const start6Months = subMonths(startOfMonth(today), 5)
    const startYear = startOfYear(today)

    // Ekskul orgs (programming, english)
    const ekskulOrgs = orgs.filter(o => o === 'programming' || o === 'english') as ('programming' | 'english')[]
    // Organisasi orgs (osis, mpk)
    const orgOrgs = orgs.filter(o => o === 'osis' || o === 'mpk')

    const response: any = { orgs }

    // Kehadiran Statistics
    if (type === 'all' || type === 'attendance') {
      const [absensiSiswaMingguan, absensiOrgMingguan, absensiSiswaBulanan, absensiOrgBulanan, absensiSiswaTahunan, absensiOrgTahunan] = await Promise.all([
        ekskulOrgs.length ? prisma.absensi.findMany({
          where: {
            tanggal: { gte: start7 },
            siswa: { ekskul: { in: ekskulOrgs } }
          },
          select: { tanggal: true, status: true }
        }) : Promise.resolve([]),
        orgOrgs.length ? prisma.absensiOrganisasi.findMany({
          where: {
            tanggal: { gte: start7 },
            organisasi_type: { in: orgOrgs as any[] }
          },
          select: { tanggal: true, status: true }
        }) : Promise.resolve([]),
        ekskulOrgs.length ? prisma.absensi.findMany({
          where: {
            tanggal: { gte: start30 },
            siswa: { ekskul: { in: ekskulOrgs } }
          },
          select: { tanggal: true, status: true }
        }) : Promise.resolve([]),
        orgOrgs.length ? prisma.absensiOrganisasi.findMany({
          where: {
            tanggal: { gte: start30 },
            organisasi_type: { in: orgOrgs as any[] }
          },
          select: { tanggal: true, status: true }
        }) : Promise.resolve([]),
        ekskulOrgs.length ? prisma.absensi.findMany({
          where: {
            tanggal: { gte: startYear },
            siswa: { ekskul: { in: ekskulOrgs } }
          },
          select: { tanggal: true, status: true }
        }) : Promise.resolve([]),
        orgOrgs.length ? prisma.absensiOrganisasi.findMany({
          where: {
            tanggal: { gte: startYear },
            organisasi_type: { in: orgOrgs as any[] }
          },
          select: { tanggal: true, status: true }
        }) : Promise.resolve([]),
      ])

      const absensiMingguan = [...absensiSiswaMingguan, ...absensiOrgMingguan]
      const absensiBulanan = [...absensiSiswaBulanan, ...absensiOrgBulanan]
      const absensiTahunan = [...absensiSiswaTahunan, ...absensiOrgTahunan]

      // Weekly attendance
      response.kehadiranMingguan = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(today, 6 - i)
        const dStr = format(d, 'yyyy-MM-dd')
        const dayRecords = absensiMingguan.filter(a => format(a.tanggal, 'yyyy-MM-dd') === dStr)
        return {
          day: format(d, 'EEE'),
          fullDate: dStr,
          hadir: dayRecords.filter(r => r.status === 'hadir').length,
          tidak_hadir: dayRecords.filter(r => r.status !== 'hadir').length,
          izin: dayRecords.filter(r => r.status === 'izin').length,
          sakit: dayRecords.filter(r => r.status === 'sakit').length,
          alpa: dayRecords.filter(r => r.status === 'tidak_hadir').length,
        }
      })

      // Monthly attendance (30 days)
      response.kehadiranBulanan = Array.from({ length: 30 }, (_, i) => {
        const d = subDays(today, 29 - i)
        const dStr = format(d, 'yyyy-MM-dd')
        const dayRecords = absensiBulanan.filter(a => format(a.tanggal, 'yyyy-MM-dd') === dStr)
        return {
          date: format(d, 'dd MMM'),
          hadir: dayRecords.filter(r => r.status === 'hadir').length,
          tidak_hadir: dayRecords.filter(r => r.status !== 'hadir').length,
        }
      })

      // Yearly attendance by month
      const months = Array.from({ length: 12 }, (_, i) => {
        const m = new Date(today.getFullYear(), i, 1)
        return {
          month: format(m, 'MMM'),
          monthNum: i + 1,
        }
      })
      response.kehadiranTahunan = months.map(m => {
        const monthRecords = absensiTahunan.filter(a => a.tanggal.getMonth() === m.monthNum - 1)
        return {
          month: m.month,
          hadir: monthRecords.filter(r => r.status === 'hadir').length,
          tidak_hadir: monthRecords.filter(r => r.status !== 'hadir').length,
          persentase: monthRecords.length > 0 
            ? Math.round((monthRecords.filter(r => r.status === 'hadir').length / monthRecords.length) * 100)
            : 0,
        }
      })

      // Attendance by organization (kept for separate view if needed)
      if (orgOrgs.length > 0) {
        response.kehadiranOrganisasi = {
          osis: orgOrgs.includes('osis') ? {
            total: absensiOrgBulanan.filter(a => (a as any).organisasi_type === 'osis').length,
            hadir: absensiOrgBulanan.filter(a => (a as any).organisasi_type === 'osis' && a.status === 'hadir').length,
            tidak_hadir: absensiOrgBulanan.filter(a => (a as any).organisasi_type === 'osis' && a.status !== 'hadir').length,
          } : null,
          mpk: orgOrgs.includes('mpk') ? {
            total: absensiOrgBulanan.filter(a => (a as any).organisasi_type === 'mpk').length,
            hadir: absensiOrgBulanan.filter(a => (a as any).organisasi_type === 'mpk' && a.status === 'hadir').length,
            tidak_hadir: absensiOrgBulanan.filter(a => (a as any).organisasi_type === 'mpk' && a.status !== 'hadir').length,
          } : null,
        }
      }
    }

    // Financial Statistics
    if (type === 'all' || type === 'finance') {
      const [kasSiswaBulanan, kasOrgBulanan, pengeluaranBulanan, kasSiswaTahunan, kasOrgTahunan, pengeluaranTahunan] = await Promise.all([
        ekskulOrgs.length ? prisma.absensi.findMany({
          where: {
            tanggal: { gte: start6Months },
            siswa: { ekskul: { in: ekskulOrgs } }
          },
          select: { tanggal: true, uang_kas: true }
        }) : Promise.resolve([]),
        orgOrgs.length ? prisma.absensiOrganisasi.findMany({
          where: {
            tanggal: { gte: start6Months },
            organisasi_type: { in: orgOrgs as any[] }
          },
          select: { tanggal: true, uang_kas: true }
        }) : Promise.resolve([]),
        orgs.length ? prisma.pengeluaranKas.findMany({
          where: {
            tanggal: { gte: start6Months },
            ...(userRole !== 'administrator' ? { organisasi_type: { in: orgs as any[] } } : {})
          },
          select: { tanggal: true, nominal: true }
        }) : Promise.resolve([]),
        ekskulOrgs.length ? prisma.absensi.findMany({
          where: {
            tanggal: { gte: startYear },
            siswa: { ekskul: { in: ekskulOrgs } }
          },
          select: { tanggal: true, uang_kas: true }
        }) : Promise.resolve([]),
        orgOrgs.length ? prisma.absensiOrganisasi.findMany({
          where: {
            tanggal: { gte: startYear },
            organisasi_type: { in: orgOrgs as any[] }
          },
          select: { tanggal: true, uang_kas: true }
        }) : Promise.resolve([]),
        orgs.length ? prisma.pengeluaranKas.findMany({
          where: {
            tanggal: { gte: startYear },
            ...(userRole !== 'administrator' ? { organisasi_type: { in: orgs as any[] } } : {})
          },
          select: { tanggal: true, nominal: true }
        }) : Promise.resolve([]),
      ])

      const kasBulanan = [...kasSiswaBulanan, ...kasOrgBulanan]
      const kasTahunan = [...kasSiswaTahunan, ...kasOrgTahunan]

      // Monthly finance (6 months)
      const months6 = Array.from({ length: 6 }, (_, i) => subMonths(today, 5 - i))
      response.keuanganBulanan = months6.map(m => {
        const mStr = format(m, 'yyyy-MM')
        const pemasukanTotal = kasBulanan
          .filter((a: any) => format(a.tanggal, 'yyyy-MM') === mStr)
          .reduce((s: number, a: { uang_kas: number | null }) => s + (a.uang_kas || 0), 0)
        const pengeluaranTotal = pengeluaranBulanan
          .filter((a: any) => format(a.tanggal, 'yyyy-MM') === mStr)
          .reduce((s: number, a: { nominal: number | null }) => s + (a.nominal || 0), 0)
        return {
          bulan: format(m, 'MMM yyyy'),
          pemasukan: pemasukanTotal,
          pengeluaran: pengeluaranTotal,
          saldo: pemasukanTotal - pengeluaranTotal,
        }
      })

      // Yearly finance
      const months12 = Array.from({ length: 12 }, (_, i) => new Date(today.getFullYear(), i, 1))
      response.keuanganTahunan = months12.map(m => {
        const mStr = format(m, 'yyyy-MM')
        const pemasukanTotal = kasTahunan
          .filter((a: any) => format(a.tanggal, 'yyyy-MM') === mStr)
          .reduce((s: number, a: any) => s + (a.uang_kas || 0), 0)
        const pengeluaranTotal = pengeluaranTahunan
          .filter((a: any) => format(a.tanggal, 'yyyy-MM') === mStr)
          .reduce((s: number, a: { nominal: number | null }) => s + (a.nominal || 0), 0)
        return {
          bulan: format(m, 'MMM'),
          pemasukan: pemasukanTotal,
          pengeluaran: pengeluaranTotal,
          saldo: pemasukanTotal - pengeluaranTotal,
        }
      })

      // Finance by organization
      if (orgOrgs.length > 0) {
        const [kasOsisTotal, kasMpkTotal, pengeluaranOsis, pengeluaranMpk] = await Promise.all([
          orgOrgs.includes('osis') ? prisma.absensiOrganisasi.aggregate({
            where: { organisasi_type: 'osis' },
            _sum: { uang_kas: true }
          }) : Promise.resolve({ _sum: { uang_kas: 0 } }),
          orgOrgs.includes('mpk') ? prisma.absensiOrganisasi.aggregate({
            where: { organisasi_type: 'mpk' },
            _sum: { uang_kas: true }
          }) : Promise.resolve({ _sum: { uang_kas: 0 } }),
          orgOrgs.includes('osis') ? prisma.pengeluaranKas.aggregate({
            where: { organisasi_type: 'osis' },
            _sum: { nominal: true }
          }) : Promise.resolve({ _sum: { nominal: 0 } }),
          orgOrgs.includes('mpk') ? prisma.pengeluaranKas.aggregate({
            where: { organisasi_type: 'mpk' },
            _sum: { nominal: true }
          }) : Promise.resolve({ _sum: { nominal: 0 } }),
        ])

        response.keuanganOrganisasi = {
          osis: orgOrgs.includes('osis') ? {
            pemasukan: kasOsisTotal._sum?.uang_kas || 0,
            pengeluaran: pengeluaranOsis._sum?.nominal || 0,
            saldo: (kasOsisTotal._sum?.uang_kas || 0) - (pengeluaranOsis._sum?.nominal || 0),
          } : null,
          mpk: orgOrgs.includes('mpk') ? {
            pemasukan: kasMpkTotal._sum?.uang_kas || 0,
            pengeluaran: pengeluaranMpk._sum?.nominal || 0,
            saldo: (kasMpkTotal._sum?.uang_kas || 0) - (pengeluaranMpk._sum?.nominal || 0),
          } : null,
        }
      }
    }

    // Kas Siswa Statistics (for charts only)
    if (type === 'all' || type === 'kas-siswa') {
      const [siswaKasData, osisKasData, mpkKasData] = await Promise.all([
        ekskulOrgs.length ? prisma.siswa.findMany({
          where: { ekskul: { in: ekskulOrgs } },
          include: { absensi: { select: { uang_kas: true } } },
        }) : Promise.resolve([]),
        orgOrgs.includes('osis') ? prisma.anggotaOsis.findMany({
          include: { absensi: { select: { uang_kas: true } } },
        }) : Promise.resolve([]),
        orgOrgs.includes('mpk') ? prisma.anggotaMpk.findMany({
          include: { absensi: { select: { uang_kas: true } } },
        }) : Promise.resolve([]),
      ])

      // Process kas siswa data for charts
      const processKasData = (data: any[], label: string) => {
        return data.map(item => ({
          nama: item.nama,
          kelas: item.kelas || item.jabatan || '-',
          total_kas: item.absensi.reduce((sum: number, a: any) => sum + (a.uang_kas || 0), 0),
          organisasi: label,
        })).sort((a, b) => b.total_kas - a.total_kas).slice(0, 20) // Top 20 only
      }

      response.kasSiswa = {
        programming: ekskulOrgs.includes('programming') ? processKasData(
          siswaKasData.filter((s: any) => s.ekskul === 'programming'),
          'Programming'
        ) : [],
        english: ekskulOrgs.includes('english') ? processKasData(
          siswaKasData.filter((s: any) => s.ekskul === 'english'),
          'English'
        ) : [],
        osis: orgOrgs.includes('osis') ? processKasData(osisKasData, 'OSIS') : [],
        mpk: orgOrgs.includes('mpk') ? processKasData(mpkKasData, 'MPK') : [],
      }

      // Distribution by kas ranges
      const allKasValues = [
        ...siswaKasData.map((s: any) => s.absensi.reduce((sum: number, a: any) => sum + (a.uang_kas || 0), 0)),
        ...osisKasData.map((s: any) => s.absensi.reduce((sum: number, a: any) => sum + (a.uang_kas || 0), 0)),
        ...mpkKasData.map((s: any) => s.absensi.reduce((sum: number, a: any) => sum + (a.uang_kas || 0), 0)),
      ]

      response.kasDistribution = [
        { range: '0', count: allKasValues.filter(v => v === 0).length },
        { range: '1-50k', count: allKasValues.filter(v => v > 0 && v <= 50000).length },
        { range: '50k-100k', count: allKasValues.filter(v => v > 50000 && v <= 100000).length },
        { range: '100k-150k', count: allKasValues.filter(v => v > 100000 && v <= 150000).length },
        { range: '150k-200k', count: allKasValues.filter(v => v > 150000 && v <= 200000).length },
        { range: '>200k', count: allKasValues.filter(v => v > 200000).length },
      ]
    }

    // Add cache headers to reduce database load
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('[REPORTS_GET_ERROR]', error)
    return NextResponse.json(
      { error: 'Gagal memuat data laporan statistik. Silakan coba lagi nanti.' },
      { status: 500 }
    )
  }
}
