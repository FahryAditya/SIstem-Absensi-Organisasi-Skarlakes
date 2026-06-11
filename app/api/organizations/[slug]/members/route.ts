import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug: params.slug }
    })
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    const members = await prisma.member.findMany({
      where: { organization_id: org.id },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ success: true, data: members })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
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

    // RBAC Check
    if (session.role !== 'administrator') {
      const isOrgAdmin = await prisma.organizationAdmin.findUnique({
        where: {
          user_id_organization_id: {
            user_id: session.id,
            organization_id: org.id
          }
        }
      })
      if (!isOrgAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { nis, name, email, class: className } = await req.json()
    if (!name) return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 })

    const member = await prisma.member.create({
      data: {
        organization_id: org.id,
        nis,
        name,
        email,
        class: className
      }
    })

    return NextResponse.json({ success: true, data: member })
  } catch (error) {
    console.error('Create member error:', error)
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
  }
}
