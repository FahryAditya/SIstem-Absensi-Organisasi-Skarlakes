import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cacheGet } from '@/lib/mem-cache'
import { format, subDays, startOfMonth, subMonths } from 'date-fns'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userRole: req.headers.get('x-user-role') || '',
    activeOrgId: req.headers.get('x-active-org-id') ? parseInt(req.headers.get('x-active-org-id')!) : undefined
  }
}

function isSuperAdmin(role: string) {
  return role === 'SUPER_ADMIN' || role === 'administrator' || role === 'admin_osis_mpk'
}

export async function GET(req: NextRequest) {
  const { userId, userRole, activeOrgId } = getCtx(req)
  const superAdmin = isSuperAdmin(userRole)

  const { searchParams } = new URL(req.url)
  const part = searchParams.get('part') || 'all'

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const start7 = subDays(today, 6)

  // Fetch accessible organizations
  const accessibleOrgs = await prisma.organization.findMany({
    where: superAdmin ? {} : {
      admins: { some: { user_id: userId } }
    },
    select: { id: true, slug: true, nama: true, school_origin: true }
  })

  const accessibleOrgIds = accessibleOrgs.map(o => o.id)

  // For non-super-admin, filter by activeOrgId; for super-admin, no filter
  const filterOrgId = superAdmin ? undefined : activeOrgId

  const response: any = { orgs: accessibleOrgs }

  if (part === 'all' || part === 'stats') {
    const statsCacheKey = `dashboard:stats:${userRole}:${activeOrgId || 'global'}:${todayStr}`

    const stats = await cacheGet(statsCacheKey, 30_000, async () => {
      // Where restricted to accessible orgs (for non-super-admin)
      const accessibleWhere = superAdmin ? {} : { organization_id: { in: accessibleOrgIds } }
      const effectiveWhere = filterOrgId ? { organization_id: filterOrgId } : accessibleWhere

      // Per-organization member counts
      const orgMemberCounts = await prisma.member.groupBy({
        by: ['organization_id'],
        where: effectiveWhere,
        _count: { id: true }
      })

      const orgCountMap: Record<number, number> = {}
      orgMemberCounts.forEach(c => { orgCountMap[c.organization_id] = c._count.id })

      // Find org IDs by slug
      const findBySlug = (slug: string) => accessibleOrgs.find(o => o.slug === slug)?.id

      const programmingId = findBySlug('programming')
      const englishId = findBySlug('english')
      const osisId = findBySlug('osis')
      const mpkId = findBySlug('mpk')

      const totalProgramming = programmingId ? (orgCountMap[programmingId] || 0) : 0
      const totalEnglish = englishId ? (orgCountMap[englishId] || 0) : 0
      const totalOsis = osisId ? (orgCountMap[osisId] || 0) : 0
      const totalMpk = mpkId ? (orgCountMap[mpkId] || 0) : 0

      const [
        totalMembers,
        hadirHariIni,
        totalPemasukanData,
        totalPengeluaranData,
        leaderboardProgramming,
        leaderboardEnglish,
      ] = await Promise.all([
        prisma.member.count({ where: effectiveWhere }),
        prisma.attendance.count({
          where: {
            ...effectiveWhere,
            date: new Date(todayStr),
            status: 'hadir',
          }
        }),
        prisma.cashTransaction.aggregate({
          where: { ...effectiveWhere, type: 'INCOME' },
          _sum: { amount: true }
        }),
        prisma.cashTransaction.aggregate({
          where: { ...effectiveWhere, type: 'EXPENSE' },
          _sum: { amount: true }
        }),
        // Leaderboard for programming
        programmingId ? prisma.member.findMany({
          where: { organization_id: programmingId },
          orderBy: { exp: 'desc' },
          take: 10,
          select: { id: true, name: true, class: true, exp: true }
        }) : Promise.resolve([]),
        // Leaderboard for english
        englishId ? prisma.member.findMany({
          where: { organization_id: englishId },
          orderBy: { exp: 'desc' },
          take: 10,
          select: { id: true, name: true, class: true, exp: true }
        }) : Promise.resolve([]),
      ])

      const totalPemasukan = totalPemasukanData._sum?.amount || 0
      const totalPengeluaran = totalPengeluaranData._sum?.amount || 0

      // Map leaderboard fields: name->nama, class->kelas, exp->xp
      const mapLeaderboard = (list: any[]) => list.map(m => ({ id: m.id, nama: m.name, kelas: m.class, xp: m.exp }))

      return {
        totalSiswa: totalMembers,
        totalProgramming,
        totalEnglish,
        totalOsis,
        totalMpk,
        hadirHariIni,
        totalPemasukan,
        totalPengeluaran,
        totalKas: totalPemasukan - totalPengeluaran,
        leaderboardProgramming: mapLeaderboard(leaderboardProgramming),
        leaderboardEnglish: mapLeaderboard(leaderboardEnglish),
      }
    })

    Object.assign(response, stats)
  }

  if (part === 'all' || part === 'charts') {
    const chartsCacheKey = `dashboard:charts:${userRole}:${activeOrgId || 'global'}:${format(today, 'yyyy-MM-dd-HH')}`

    const charts = await cacheGet(chartsCacheKey, 120_000, async () => {
      const effectiveWhere = filterOrgId ? { organization_id: filterOrgId } : (superAdmin ? {} : { organization_id: { in: accessibleOrgIds } })
      const where = effectiveWhere

      // Kehadiran 7 hari terakhir - build query based on role
      let attendanceRaw: any[]
      if (filterOrgId) {
        attendanceRaw = await prisma.$queryRaw`
          SELECT 
            TO_CHAR(date, 'YYYY-MM-DD') as date_str,
            status,
            COUNT(*)::int as count
          FROM attendance
          WHERE date >= ${start7}
            AND organization_id = ${filterOrgId}
          GROUP BY TO_CHAR(date, 'YYYY-MM-DD'), status
        `
      } else if (!superAdmin && accessibleOrgIds.length > 0) {
        attendanceRaw = await prisma.$queryRaw`
          SELECT 
            TO_CHAR(date, 'YYYY-MM-DD') as date_str,
            status,
            COUNT(*)::int as count
          FROM attendance
          WHERE date >= ${start7}
            AND organization_id = ANY(${accessibleOrgIds}::int[])
          GROUP BY TO_CHAR(date, 'YYYY-MM-DD'), status
        `
      } else {
        attendanceRaw = await prisma.$queryRaw`
          SELECT 
            TO_CHAR(date, 'YYYY-MM-DD') as date_str,
            status,
            COUNT(*)::int as count
          FROM attendance
          WHERE date >= ${start7}
          GROUP BY TO_CHAR(date, 'YYYY-MM-DD'), status
        `
      }

      // Kas 6 bulan terakhir
      const months = Array.from({ length: 6 }, (_, i) => subMonths(today, 5 - i))
      const kasPerBulan = await Promise.all(months.map(async (m) => {
        const start = startOfMonth(m)
        const nextMonth = startOfMonth(subMonths(m, -1))
        const monthWhere = {
          ...where,
          created_at: {
            gte: start,
            lt: nextMonth
          }
        }
        
        const income = await prisma.cashTransaction.aggregate({
          where: { ...monthWhere, type: 'INCOME' },
          _sum: { amount: true }
        })
        const expense = await prisma.cashTransaction.aggregate({
          where: { ...monthWhere, type: 'EXPENSE' },
          _sum: { amount: true }
        })
        
        return {
          bulan: format(m, 'MMM'),
          total: (income._sum?.amount || 0) - (expense._sum?.amount || 0)
        }
      }))

      // Process attendance data
      const kehadiranMingguan = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(today, 6 - i)
        const dStr = format(d, 'yyyy-MM-dd')
        const dayStats = attendanceRaw.filter(a => a.date_str === dStr)
        return {
          day: format(d, 'EEE'),
          hadir: dayStats.find(s => s.status === 'hadir')?.count || 0,
          tidak_hadir: dayStats.filter(s => s.status !== 'hadir').reduce((sum, s) => sum + s.count, 0)
        }
      })

      return { kehadiranMingguan, kasPerBulan }
    })

    response.kehadiranMingguan = charts.kehadiranMingguan
    response.kasPerBulan = charts.kasPerBulan
  }

  if (part === 'all' || part === 'logs') {
    const logsCacheKey = `dashboard:logs:${userRole}:${activeOrgId || 'global'}`
    const logWhere = superAdmin ? {} : (activeOrgId ? { organization_id: activeOrgId } : { organization_id: { in: accessibleOrgIds } })
    
    response.recentLog = await cacheGet(logsCacheKey, 10_000, () =>
      prisma.logAktivitas.findMany({
        where: logWhere,
        orderBy: { created_at: 'desc' },
        take: 5,
        select: { id: true, user_nama: true, deskripsi: true, created_at: true, aksi: true }
      })
    )
  }

  if (part === 'all' || part === 'request_stats') {
    // Only for super admin
    if (superAdmin) {
      const reqStatsCacheKey = `dashboard:reqstats:${format(today, 'yyyy-MM-dd-HH')}`
      
      const requestStats = await cacheGet(reqStatsCacheKey, 120_000, async () => {
        const thirtyDaysAgo = subDays(today, 29)
        const [perAksi, grandTotalRecord, dailyRaw] = await Promise.all([
          prisma.logAktivitas.groupBy({
            by: ['aksi'],
            _count: { id: true }
          }),
          prisma.logAktivitas.count(),
          prisma.$queryRaw`
            SELECT 
              TO_CHAR(created_at, 'YYYY-MM-DD') as date_str,
              aksi,
              COUNT(*)::int as count
            FROM log_aktivitas
            WHERE created_at >= ${thirtyDaysAgo}
            GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD'), aksi
          ` as unknown as any[]
        ])

        const perAksiResult = perAksi.map(p => ({
          aksi: p.aksi,
          method: p.aksi === 'CREATE' ? 'POST' : p.aksi === 'UPDATE' ? 'PUT' : p.aksi === 'DELETE' ? 'DELETE' : 'GET',
          count: p._count.id
        }))

        // Build 30-day daily data
        const daily30 = Array.from({ length: 30 }, (_, i) => {
          const d = subDays(today, 29 - i)
          const dStr = format(d, 'yyyy-MM-dd')
          const dayData = dailyRaw.filter((r: any) => r.date_str === dStr)
          return {
            date: dStr,
            label: format(d, 'dd/MM'),
            CREATE: dayData.find((r: any) => r.aksi === 'CREATE')?.count || 0,
            UPDATE: dayData.find((r: any) => r.aksi === 'UPDATE')?.count || 0,
            DELETE: dayData.find((r: any) => r.aksi === 'DELETE')?.count || 0,
            LOGIN: dayData.find((r: any) => r.aksi === 'LOGIN')?.count || 0,
            LOGOUT: dayData.find((r: any) => r.aksi === 'LOGOUT')?.count || 0,
          }
        })

        return {
          grandTotal: grandTotalRecord,
          perAksi: perAksiResult,
          daily30,
        }
      })

      response.requestStats = requestStats
    }
  }

  return NextResponse.json(response)
}
