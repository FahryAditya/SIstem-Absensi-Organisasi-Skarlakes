import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const registrationSchema = z.object({
  organization_id: z.number(),
  name: z.string().min(3).max(100),
  class: z.string(),
  major: z.string(),
  email: z.string().email().refine(email => email.endsWith('@gmail.com'), {
    message: 'Harus menggunakan email @gmail.com'
  }),
  nisn: z.string().optional().nullable(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registrationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { organization_id, email } = parsed.data

    // 1. Check organization
    const org = await prisma.organization.findUnique({
      where: { id: organization_id }
    })

    if (!org) {
      return NextResponse.json({ error: 'Organisasi tidak valid' }, { status: 400 })
    }

    // 2. Check duplicate
    const existing = await prisma.registration.findFirst({
      where: {
        email,
        organization_id,
        status: { in: ['MENUNGGU', 'CALON'] }
      }
    })

    if (existing) {
      return NextResponse.json({ 
        error: 'Email sudah terdaftar di organisasi ini',
        code: 'DUPLICATE_EMAIL'
      }, { status: 409 })
    }

    // 3. Save registration
    const registration = await prisma.registration.create({
      data: {
        ...parsed.data,
        status: 'MENUNGGU'
      }
    })

    console.log(`[REGISTRATION] New registration for ${org.nama}: ${registration.name} (${registration.email})`)

    return NextResponse.json({ 
      success: true, 
      data: registration,
      message: 'Pendaftaran berhasil dikirim. Tunggu konfirmasi admin melalui email.'
    })
  } catch (error: any) {
    console.error('[REGISTRATION ERROR]', error)
    return NextResponse.json({ error: 'Terjadi kesalahan saat memproses pendaftaran' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('orgId')
  const status = searchParams.get('status')
  
  const userId = parseInt(req.headers.get('x-user-id') || '0')
  const userRole = req.headers.get('x-user-role') || ''
  const activeOrgId = req.headers.get('x-active-org-id') ? parseInt(req.headers.get('x-active-org-id')!) : undefined

  const filterOrgId = userRole === 'SUPER_ADMIN' ? (orgId ? parseInt(orgId) : activeOrgId) : activeOrgId

  if (!filterOrgId && userRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No active organization selected' }, { status: 400 })
  }

  const where = {
    ...(filterOrgId ? { organization_id: filterOrgId } : {}),
    ...(status ? { status: status as any } : {})
  }

  const registrations = await prisma.registration.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: { organization: { select: { nama: true } } }
  })

  return NextResponse.json({ data: registrations })
}
