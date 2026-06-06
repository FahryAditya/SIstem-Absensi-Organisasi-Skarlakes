import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')
    const type = searchParams.get('type') // 'eskul' or 'osis-mpk'
    const orgId = searchParams.get('orgId')

    if (!email || !type || !orgId) {
      return NextResponse.json({ error: 'Parameter tidak lengkap' }, { status: 400 })
    }

    const id = parseInt(orgId)
    let exists = false

    if (type === 'eskul') {
      const count = await prisma.registrationEskul.count({
        where: {
          email_gmail: email,
          organization_id: id,
          status: { in: ['MENUNGGU', 'DITERIMA'] }
        }
      })
      exists = count > 0
    } else if (type === 'osis-mpk') {
      const count = await prisma.registrationOsisMpk.count({
        where: {
          email_gmail: email,
          organization_id: id,
          status: { in: ['CALON', 'DITERIMA'] }
        }
      })
      exists = count > 0
    }

    return NextResponse.json({ available: !exists })
  } catch (error: any) {
    console.error('[CHECK EMAIL ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
