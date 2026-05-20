import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessibleOrgs } from '@/lib/auth'
import { cacheGet } from '@/lib/mem-cache'
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
    // Cache key: per-role (setiap role melihat data berbeda) + tanggal hari ini
    // TTL 30 detik: cukup untuk menyerap burst 12 user, tapi data masih fresh
    const statsCacheKey = `dashboard:stats:${userRole}:${todayStr}`

    const stats = await cacheGet(statsCacheKey, 30_000, async () => {
      const [
        totalSiswaCount,
        totalProgramming,
        totalEnglish,
        totalOsis,
        totalMpk,
        hadirEkskulHariIni,
        hadirOrganisasiHariIni,
        kasEkskulTotal,
        kasOrgTotal,
        pengeluaranTotalData,
        leaderboardProgramming,
        leaderboardEnglish,
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
        prisma.siswa.findMany({
          where: { ekskul: 'programming' },
          orderBy: { xp: 'desc' },
          take: 10,
          select: { id: true, nama: true, kelas: true, xp: true }
        }),
        prisma.siswa.findMany({
          where: { ekskul: 'english' },
          orderBy: { xp: 'desc' },
          take: 10,
          select: { id: true, nama: true, kelas: true, xp: true }
        })
      ])

      const totalPemasukan = (kasEkskulTotal._sum?.uang_kas || 0) + (kasOrgTotal._sum?.uang_kas || 0)
      const totalPengeluaran = pengeluaranTotalData._sum?.nominal || 0

      // Filter totalSiswa secara dinamis berdasarkan hak akses role
      let totalSiswa = 0
      if (userRole === 'administrator') {
        totalSiswa = totalSiswaCount + totalOsis + totalMpk
      } else {
        if (orgs.includes('programming')) totalSiswa += totalProgramming
        if (orgs.includes('english')) totalSiswa += totalEnglish
        if (orgs.includes('osis')) totalSiswa += totalOsis
        if (orgs.includes('mpk')) totalSiswa += totalMpk
      }

      return {
        totalSiswa,
        totalProgramming,
        totalEnglish,
        totalOsis,
        totalMpk,
        hadirHariIni: hadirEkskulHariIni + hadirOrganisasiHariIni,
        totalPemasukan,
        totalPengeluaran,
        totalKas: totalPemasukan - totalPengeluaran,
        leaderboardProgramming,
        leaderboardEnglish,
      }
    })

    Object.assign(response, stats)
  }

  if (part === 'all' || part === 'charts') {
    // Cache charts per role, per minggu-ke (7 hari terakhir cukup stale 2 menit)
    const chartsCacheKey = `dashboard:charts:${userRole}:${format(today, 'yyyy-MM-dd-HH')}` // per jam

    const charts = await cacheGet(chartsCacheKey, 120_000, async () => {
      const [
        absensiMingguEkskul,
        kasEkskulBulanan,
        kasOrgBulanan,
        pengeluaranBulanan,
      ] = await Promise.all([
        ekskulOrgs.length ? prisma.$queryRaw`
          SELECT 
            TO_CHAR(a.tanggal, 'YYYY-MM-DD') AS tanggal, 
            a.status::text AS status, 
            COUNT(*)::int AS count
          FROM absensi a
          INNER JOIN siswa s ON a.siswa_id = s.id
          WHERE a.tanggal >= ${start7} AND s.ekskul::text = ANY(${ekskulOrgs})
          GROUP BY TO_CHAR(a.tanggal, 'YYYY-MM-DD'), a.status
        ` : Promise.resolve([]),

        ekskulOrgs.length ? prisma.$queryRaw`
          SELECT 
            TO_CHAR(a.tanggal, 'YYYY-MM') AS bulan, 
            SUM(a.uang_kas)::int AS total
          FROM absensi a
          INNER JOIN siswa s ON a.siswa_id = s.id
          WHERE a.tanggal >= ${subMonths(startOfMonth(today), 5)} AND s.ekskul::text = ANY(${ekskulOrgs})
          GROUP BY TO_CHAR(a.tanggal, 'YYYY-MM')
        ` : Promise.resolve([]),

        orgOrgs.length ? prisma.$queryRaw`
          SELECT 
            TO_CHAR(tanggal, 'YYYY-MM') AS bulan, 
            SUM(uang_kas)::int AS total
          FROM absensi_organisasi
          WHERE tanggal >= ${subMonths(startOfMonth(today), 5)} AND organisasi_type::text = ANY(${orgOrgs})
          GROUP BY TO_CHAR(tanggal, 'YYYY-MM')
        ` : Promise.resolve([]),

        orgs.length ? (
          userRole === 'administrator' 
            ? prisma.$queryRaw`
                SELECT 
                  TO_CHAR(tanggal, 'YYYY-MM') AS bulan, 
                  SUM(nominal)::int AS total
                FROM pengeluaran_kas
                WHERE tanggal >= ${subMonths(startOfMonth(today), 5)}
                GROUP BY TO_CHAR(tanggal, 'YYYY-MM')
              `
            : prisma.$queryRaw`
                SELECT 
                  TO_CHAR(tanggal, 'YYYY-MM') AS bulan, 
                  SUM(nominal)::int AS total
                FROM pengeluaran_kas
                WHERE tanggal >= ${subMonths(startOfMonth(today), 5)} AND organisasi_type::text = ANY(${orgs})
                GROUP BY TO_CHAR(tanggal, 'YYYY-MM')
              `
        ) : Promise.resolve([]),
      ])

      // Process kehadiran mingguan
      const kehadiranMingguan = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(today, 6 - i)
        const dStr = format(d, 'yyyy-MM-dd')
        const dayStats = (absensiMingguEkskul as any[]).filter(
          a => a.tanggal === dStr
        )
        return {
          day: format(d, 'EEE'),
          hadir: dayStats.find(s => s.status === 'hadir')?.count || 0,
          tidak_hadir: dayStats.find(s => s.status !== 'hadir' && s.status !== 'kas_saja')?.count || 0,
        }
      })

      // Process kas per bulan
      const months = Array.from({ length: 6 }, (_, i) => subMonths(today, 5 - i))
      const kasPerBulan = months.map(m => {
        const mStr = format(m, 'yyyy-MM')
        const ekskulTotal = (kasEkskulBulanan as any[])
          .find(a => a.bulan === mStr)?.total || 0
        const orgTotal = (kasOrgBulanan as any[])
          .find(a => a.bulan === mStr)?.total || 0
        const pengeluaranTotal = (pengeluaranBulanan as any[])
          .find(a => a.bulan === mStr)?.total || 0
        return { bulan: format(m, 'MMM'), total: (ekskulTotal + orgTotal) - pengeluaranTotal }
      })

      return { kehadiranMingguan, kasPerBulan }
    })

    response.kehadiranMingguan = charts.kehadiranMingguan
    response.kasPerBulan = charts.kasPerBulan
  }

  if (part === 'all' || part === 'logs') {
    if (userRole === 'administrator') {
      // Log terbaru: cache pendek 10 detik agar masih terasa real-time
      const logsCacheKey = `dashboard:logs:${userRole}`
      response.recentLog = await cacheGet(logsCacheKey, 10_000, () =>
        prisma.logAktivitas.findMany({
          orderBy: { created_at: 'desc' },
          take: 5,
          select: { id: true, user_nama: true, deskripsi: true, created_at: true, aksi: true }
        })
      )
    } else {
      response.recentLog = []
    }
  }

  // ─── Request Statistics (administrator only) ─────────────────────────────────
  if ((part === 'request_stats') && userRole === 'administrator') {
    // Cache stats selama 5 menit — data historis tidak perlu real-time
    const reqStatsCacheKey = `dashboard:request_stats`
    const requestStats = await cacheGet(reqStatsCacheKey, 300_000, async () => {
      const since30 = subDays(new Date(), 29)

      // 1) Total per aksi (all time summary)
      const totalPerAksi: { aksi: string; count: number }[] = await prisma.$queryRaw`
        SELECT 
          aksi::text AS aksi, 
          COUNT(*)::int AS count
        FROM log_aktivitas
        GROUP BY aksi
      `

      // 2) Daily breakdown for last 30 days
      // Gunakan created_at::date cast via raw untuk hasil yang lebih efisien
      const dailyRaw: { aksi: string; date: string; count: number }[] = await prisma.$queryRaw`
        SELECT 
          aksi::text, 
          TO_CHAR(created_at, 'YYYY-MM-DD') AS date, 
          COUNT(*)::int AS count
        FROM log_aktivitas
        WHERE created_at >= ${since30}
        GROUP BY aksi, TO_CHAR(created_at, 'YYYY-MM-DD')
        ORDER BY date ASC
      `

      const dayMap: Record<string, Record<string, number>> = {}
      for (const row of dailyRaw) {
        const d = row.date
        if (!dayMap[d]) dayMap[d] = {}
        dayMap[d][row.aksi] = row.count
      }

      const AKSI_TYPES = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT']
      const daily30 = Array.from({ length: 30 }, (_, i) => {
        const d = subDays(new Date(), 29 - i)
        const key = format(d, 'yyyy-MM-dd')
        const entry: Record<string, any> = { date: key, label: format(d, 'dd/MM') }
        for (const a of AKSI_TYPES) entry[a] = dayMap[key]?.[a] || 0
        return entry
      })

      const grandTotal = totalPerAksi.reduce((s: number, r: any) => s + r.count, 0)
      const METHOD_MAP: Record<string, string> = {
        CREATE: 'POST', UPDATE: 'PUT', DELETE: 'DELETE', LOGIN: 'GET', LOGOUT: 'GET',
      }

      return {
        grandTotal,
        perAksi: totalPerAksi.map((r: any) => ({
          aksi: r.aksi,
          method: METHOD_MAP[r.aksi] || 'GET',
          count: r.count,
        })),
        daily30,
      }
    })

    response.requestStats = requestStats
  }

  return NextResponse.json(response)
}
