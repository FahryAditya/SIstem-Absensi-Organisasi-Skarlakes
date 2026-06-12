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

export async function GET(req: NextRequest) {
  const { userId, userRole, activeOrgId } = getCtx(req)
  
  // If ORG_ADMIN and no activeOrgId, we have a problem
  if (userRole === 'ORG_ADMIN' && !activeOrgId) {
    return NextResponse.json({ error: 'No active organization selected' }, { status: 400 })
  }

  const { searchParams } = new URL(req.url)
  const part = searchParams.get('part') || 'all'

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const start7 = subDays(today, 6)

  // Fetch accessible organizations for context
  const accessibleOrgs = await prisma.organization.findMany({
    where: userRole === 'SUPER_ADMIN' ? {} : {
      admins: { some: { user_id: userId } }
    }
  })

  const response: any = { orgs: accessibleOrgs }

  // Determine current context for filtering
  const filterOrgId = userRole === 'SUPER_ADMIN' ? undefined : activeOrgId

  if (part === 'all' || part === 'stats') {
    const statsCacheKey = `dashboard:stats:${userRole}:${activeOrgId || 'global'}:${todayStr}`

    const stats = await cacheGet(statsCacheKey, 30_000, async () => {
      const where = filterOrgId ? { organization_id: filterOrgId } : {}
      
      const [
        totalMembers,
        hadirHariIni,
        totalPemasukanData,
        totalPengeluaranData,
        leaderboard,
      ] = await Promise.all([
        prisma.member.count({ where }),
        prisma.attendance.count({
          where: {
            ...where,
            date: new Date(todayStr),
            status: 'hadir',
          }
        }),
        prisma.cashTransaction.aggregate({
          where: { ...where, type: 'INCOME' },
          _sum: { amount: true }
        }),
        prisma.cashTransaction.aggregate({
          where: { ...where, type: 'EXPENSE' },
          _sum: { amount: true }
        }),
        prisma.member.findMany({
          where,
          orderBy: { exp: 'desc' },
          take: 10,
          select: { id: true, name: true, class: true, exp: true }
        })
      ])

      const totalPemasukan = totalPemasukanData._sum?.amount || 0
      const totalPengeluaran = totalPengeluaranData._sum?.amount || 0

      return {
        totalSiswa: totalMembers,
        hadirHariIni,
        totalPemasukan,
        totalPengeluaran,
        totalKas: totalPemasukan - totalPengeluaran,
        leaderboard,
      }
    })

    Object.assign(response, stats)
  }

  if (part === 'all' || part === 'charts') {
    const chartsCacheKey = `dashboard:charts:${userRole}:${activeOrgId || 'global'}:${format(today, 'yyyy-MM-dd-HH')}`

    const charts = await cacheGet(chartsCacheKey, 120_000, async () => {
      const where = filterOrgId ? { organization_id: filterOrgId } : {}
      
      // Kehadiran 7 hari terakhir
      // Note: In real app, you might use a more complex query or raw SQL for grouping
      const attendanceRaw: any[] = await prisma.$queryRaw`
        SELECT 
          TO_CHAR(date, 'YYYY-MM-DD') as date_str,
          status,
          COUNT(*)::int as count
        FROM attendance
        WHERE date >= ${start7}
        ${filterOrgId ? prisma.$queryRaw`AND organization_id = ${filterOrgId}` : prisma.$queryRaw``}
        GROUP BY TO_CHAR(date, 'YYYY-MM-DD'), status
      `

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
    const logWhere = userRole === 'SUPER_ADMIN' ? {} : { organization_id: activeOrgId }
    
    response.recentLog = await cacheGet(logsCacheKey, 10_000, () =>
      prisma.logAktivitas.findMany({
        where: logWhere,
        orderBy: { created_at: 'desc' },
        take: 5,
        select: { id: true, user_nama: true, deskripsi: true, created_at: true, aksi: true }
      })
    )
  }

  return NextResponse.json(response)
}
