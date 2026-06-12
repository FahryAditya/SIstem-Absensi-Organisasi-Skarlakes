import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest, signToken } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  orgId: z.number().int().positive()
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { orgId } = parsed.data

    // Verify user has access to this organization
    if (session.role !== 'SUPER_ADMIN') {
      const access = await prisma.organizationAdmin.findUnique({
        where: {
          user_id_organization_id: {
            user_id: session.id,
            organization_id: orgId
          }
        }
      })
      if (!access) {
        return NextResponse.json({ error: 'Akses ditolak untuk organisasi ini' }, { status: 403 })
      }
    } else {
      // Super admin can access any existing organization
      const exists = await prisma.organization.findUnique({ where: { id: orgId } })
      if (!exists) {
        return NextResponse.json({ error: 'Organisasi tidak ditemukan' }, { status: 404 })
      }
    }

    // Update session with new activeOrgId
    const newSession = { ...session, activeOrgId: orgId }
    const token = await signToken(newSession)

    const response = NextResponse.json({ success: true, activeOrgId: orgId })
    response.cookies.set('ekskul_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[ACTIVE ORG CHANGE ERROR]', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
