import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessibleOrgs } from '@/lib/auth'
import { format, subDays, startOfMonth, subMonths, endOfMonth } from 'date-fns'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userRole: req.headers.get('x-user-role') || '',
  }
}

export async function GET(req: NextRequest) {
  const { userRole } = getCtx(req)
  const orgs = getAccessibleOrgs(userRole)
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const start7 = subDays(today, 6)

  // Ekskul orgs (programming, english)
  const ekskulOrgs = orgs.filter(o => o === 'programming' || o === 'english') as ('programming' | 'english')[]
  // Organisasi orgs (osis, mpk)
  const orgOrgs = orgs.filter(o => o === 'osis' || o === 'mpk')

  // === PARALEL QUERIES (semua sekaligus, bukan N+1) ===
  const [
    totalSiswa,
    totalOsis,
    totalMpk,
    hadirEkskulHariIni,
    hadirOrganisasiHariIni,
    absensiMingguEkskul,
    kasEkskulBulanan,
    kasOrgBulanan,
    pengeluaranBulanan,
    recentLog,
  ] = await Promise.all([
    // Total siswa ekskul
    ekskulOrgs.length ? prisma.siswa.count({ where: { ekskul: { in: ekskulOrgs } } }) : Promise.resolve(0),

    // Total anggota OSIS
    orgOrgs.includes('osis') ? prisma.anggotaOsis.count() : Promise.resolve(0),

    // Total anggota MPK
    orgOrgs.includes('mpk') ? prisma.anggotaMpk.count() : Promise.resolve(0),

    // Hadir ekskul hari ini
    ekskulOrgs.length ? prisma.absensi.count({
      where: {
        tanggal: new Date(todayStr),
        status: 'hadir',
        siswa: { ekskul: { in: ekskulOrgs } }
      }
    }) : Promise.resolve(0),

    // Hadir organisasi hari ini
    orgOrgs.length ? prisma.absensiOrganisasi.count({
      where: {
        tanggal: new Date(todayStr),
        status: 'hadir',
        organisasi_type: { in: orgOrgs as ('osis' | 'mpk')[] }
      }
    }) : Promise.resolve(0),

    // Absensi ekskul 7 hari (single query)
    ekskulOrgs.length ? prisma.absensi.findMany({
      where: {
        tanggal: { gte: start7 },
        siswa: { ekskul: { in: ekskulOrgs } }
      },
      select: { tanggal: true, status: true }
    }) : Promise.resolve([]),

    // Kas ekskul 6 bulan (single query)
    ekskulOrgs.length ? prisma.absensi.findMany({
      where: {
        tanggal: { gte: subMonths(startOfMonth(today), 5) },
        siswa: { ekskul: { in: ekskulOrgs } }
      },
      select: { tanggal: true, uang_kas: true }
    }) : Promise.resolve([]),

    // Kas organisasi 6 bulan
    orgOrgs.length ? prisma.absensiOrganisasi.findMany({
      where: {
        tanggal: { gte: subMonths(startOfMonth(today), 5) },
        organisasi_type: { in: orgOrgs as ('osis' | 'mpk')[] }
      },
      select: { tanggal: true, uang_kas: true }
    }) : Promise.resolve([]),

    // Pengeluaran kas 6 bulan
    orgs.length ? (prisma as any).pengeluaranKas.findMany({
      where: {
        tanggal: { gte: subMonths(startOfMonth(today), 5) },
        ...(userRole !== 'administrator' ? { organisasi_type: { in: orgs as any[] } } : {})
      },
      select: { tanggal: true, nominal: true }
    }) : Promise.resolve([]),

    // Recent log (administrator only)
    userRole === 'administrator' ? prisma.logAktivitas.findMany({
      orderBy: { created_at: 'desc' },
      take: 5,
    }) : Promise.resolve([]),
  ])

  // Process minggu kehadiran
  const kehadiranMingguan = Array.from({ length: 7 }, (_, i) => {
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
  const kasPerBulan = months.map(m => {
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

  return NextResponse.json({
    totalSiswa,
    totalOsis,
    totalMpk,
    hadirHariIni: hadirEkskulHariIni + hadirOrganisasiHariIni,
    totalKas: [...kasEkskulBulanan, ...kasOrgBulanan].reduce((s, a) => s + ((a as any).uang_kas || 0), 0) - (pengeluaranBulanan as any[]).reduce((s, a) => s + (a.nominal || 0), 0),
    kehadiranMingguan,
    kasPerBulan,
    recentLog,
    orgs,
  })
}
