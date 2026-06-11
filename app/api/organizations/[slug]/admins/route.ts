import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { createLog, getIp } from '@/lib/log'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug: params.slug },
      include: {
        admins: {
          include: {
            user: {
              select: {
                id: true,
                nama: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    })

    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    return NextResponse.json({ success: true, data: org.admins })
  } catch (error) {
    console.error('Fetch org admins error:', error)
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 })

    const org = await prisma.organization.findUnique({
      where: { slug: params.slug }
    })
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    // Check if already admin
    const existing = await prisma.organizationAdmin.findUnique({
      where: {
        user_id_organization_id: {
          user_id: userId,
          organization_id: org.id
        }
      }
    })

    if (existing) return NextResponse.json({ error: 'User is already an admin for this organization' }, { status: 400 })

    const orgAdmin = await prisma.organizationAdmin.create({
      data: {
        user_id: userId,
        organization_id: org.id
      },
      include: {
        user: true
      }
    })

    await createLog({
      userId: session.id,
      userNama: session.nama,
      aksi: 'UPDATE',
      tabel: 'organizations',
      recordId: org.id,
      deskripsi: `${session.nama} menambahkan ${orgAdmin.user.nama} sebagai admin untuk unit ${org.nama}`,
      ipAddress: getIp(req)
    })

    return NextResponse.json({ success: true, data: orgAdmin })
  } catch (error) {
    console.error('Assign org admin error:', error)
    return NextResponse.json({ error: 'Failed to assign admin' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id') || '0')
    if (!id) return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })

    const assignment = await prisma.organizationAdmin.findUnique({
      where: { id },
      include: { user: true, organization: true }
    })

    if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })

    await prisma.organizationAdmin.delete({
      where: { id }
    })

    await createLog({
      userId: session.id,
      userNama: session.nama,
      aksi: 'UPDATE',
      tabel: 'organizations',
      recordId: assignment.organization_id,
      deskripsi: `${session.nama} menghapus ${assignment.user.nama} dari admin unit ${assignment.organization.nama}`,
      ipAddress: getIp(req)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove org admin error:', error)
    return NextResponse.json({ error: 'Failed to remove admin' }, { status: 500 })
  }
}
