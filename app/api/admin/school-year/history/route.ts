import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerUser } from '@/lib/server-utils'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getServerUser()
    if (!user || (user.role !== 'SUPER_ADMIN' && (user.role as string) !== 'administrator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const history = await prisma.schoolYearProgression.findMany({
      include: {
        admin: {
          select: { nama: true }
        },
        reverter: {
          select: { nama: true }
        }
      },
      orderBy: { executed_at: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: history
    })
  } catch (error: any) {
    console.error('Error fetching school year history:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
