import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug: params.slug }
    })
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0]

    const attendance = await prisma.attendanceV2.findMany({
      where: { 
        organization_id: org.id,
        date: new Date(date)
      },
      include: { member: true }
    })
    return NextResponse.json({ success: true, data: attendance })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const org = await prisma.organization.findUnique({
      where: { slug: params.slug }
    })
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    const { date, member_id, status, cash_amount, notes } = await req.json()

    const attendance = await prisma.$transaction(async (tx) => {
      const att = await tx.attendanceV2.upsert({
        where: {
          member_id_date: {
            member_id,
            date: new Date(date)
          }
        },
        create: {
          organization_id: org.id,
          member_id,
          date: new Date(date),
          attendance_status: status,
          cash_amount: cash_amount || 0,
          notes
        },
        update: {
          attendance_status: status,
          cash_amount: cash_amount || 0,
          notes
        }
      })

      // If cash is paid, create a transaction
      if (cash_amount > 0) {
        await tx.cashTransaction.create({
          data: {
            organization_id: org.id,
            member_id,
            amount: cash_amount,
            description: `Iuran Kas via Absensi (${date})`
          }
        })
      }

      return att
    })

    return NextResponse.json({ success: true, data: attendance })
  } catch (error) {
    console.error('Attendance error:', error)
    return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 })
  }
}
