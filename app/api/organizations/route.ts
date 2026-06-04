import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const orgs = await prisma.organization.findMany()
    return NextResponse.json({ success: true, data: orgs })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
  }
}
