import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function isSuperAdmin(role: string) {
  return role === 'SUPER_ADMIN' || role === 'administrator'
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const orgId = searchParams.get('orgId')
    const searchQuery = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const filterOrgId = orgId ? parseInt(orgId) : session.activeOrgId

    if (!filterOrgId && !isSuperAdmin(session.role as string)) {
      return NextResponse.json({ error: 'No active organization selected' }, { status: 400 })
    }

    // RBAC Check
    if (!isSuperAdmin(session.role as string) && filterOrgId && !session.orgIds.includes(filterOrgId)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const where: any = {
      ...(filterOrgId ? { organization_id: filterOrgId } : {}),
      status: 'ACTIVE',
      ...(searchQuery ? { name: { contains: searchQuery, mode: 'insensitive' } } : {}),
    }

    const [members, total, totalIncome, totalExpense] = await Promise.all([
      prisma.member.findMany({
        where,
        include: { 
          attendance: { select: { cash_amount: true, date: true } },
          cash_transactions: { select: { amount: true, created_at: true, type: true } }
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.member.count({ where }),
      prisma.cashTransaction.aggregate({
        where: { ...(filterOrgId ? { organization_id: filterOrgId } : {}), type: 'INCOME' },
        _sum: { amount: true }
      }),
      prisma.cashTransaction.aggregate({
        where: { ...(filterOrgId ? { organization_id: filterOrgId } : {}), type: 'EXPENSE' },
        _sum: { amount: true }
      })
    ])

    const totalKasSum = (totalIncome._sum?.amount || 0) - (totalExpense._sum?.amount || 0)

    const results = members.map(m => {
      let terakhir_bayar = null
      
      const allIncome = [
        ...m.attendance.filter(a => a.cash_amount > 0).map(a => ({ date: a.date })),
        ...m.cash_transactions.filter(t => t.type === 'INCOME').map(t => ({ date: t.created_at }))
      ]
      
      if (allIncome.length > 0) {
        const latest = allIncome.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b)
        terakhir_bayar = latest.date.toISOString()
      }

      const total_kas = m.attendance.reduce((sum, a) => sum + (a.cash_amount || 0), 0) + 
                       m.cash_transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + (t.amount || 0), 0) -
                       m.cash_transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + (t.amount || 0), 0)

      return {
        id: m.id,
        nama: m.name,
        kelas: m.class || '-',
        total_kas,
        terakhir_bayar,
      }
    })

    return NextResponse.json({
      data: results,
      totalKas: totalKasSum,
      total,
      totalPages: Math.ceil(total / limit)
    })
  } catch (e: any) {
    console.error('[KAS ERROR]', e)
    return NextResponse.json({ error: 'Terjadi kesalahan server saat memuat data kas' }, { status: 500 })
  }
}
