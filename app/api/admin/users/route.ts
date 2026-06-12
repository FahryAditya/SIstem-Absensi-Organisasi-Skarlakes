import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const userSchema = z.object({
  nama: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(['SUPER_ADMIN', 'ORG_ADMIN']),
  orgIds: z.array(z.number()).optional()
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      include: {
        organizations: {
          include: {
            organization: {
              select: { nama: true }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = userSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

    const { nama, email, password, role, orgIds } = parsed.data
    if (!password) return NextResponse.json({ error: 'Password is required for new users' }, { status: 400 })

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        nama,
        email,
        password: hashedPassword,
        role,
        organizations: {
          create: orgIds?.map(id => ({ organization_id: id }))
        }
      }
    })

    return NextResponse.json({ success: true, data: user })
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const parsed = userSchema.safeParse(rest)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

    const { nama, email, password, role, orgIds } = parsed.data

    const updateData: any = { nama, email, role }
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Update user and organizations mapping
    await prisma.$transaction([
      prisma.organizationAdmin.deleteMany({ where: { user_id: id } }),
      prisma.user.update({
        where: { id },
        data: {
          ...updateData,
          organizations: {
            create: orgIds?.map(oid => ({ organization_id: id }))
          }
        }
      })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id') || '0')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    if (id === session.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })

    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
