import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug: params.slug }
    })
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    const transactions = await prisma.cashTransaction.findMany({
      where: { organization_id: org.id },
      include: { member: true },
      orderBy: { created_at: 'desc' }
    })

    const total = await prisma.cashTransaction.aggregate({
      where: { organization_id: org.id },
      _sum: { amount: true }
    })

    return NextResponse.json({ 
      success: true, 
      data: {
        transactions,
        totalBalance: total._sum.amount || 0
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cash data' }, { status: 500 })
  }
}
