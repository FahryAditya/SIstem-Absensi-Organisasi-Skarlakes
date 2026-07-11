import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: parsed.error.errors[0].message 
        }, 
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organizations: {
          include: {
            organization: {
              select: {
                id: true,
                nama: true,
                slug: true,
                deskripsi: true,
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Email atau password salah' 
        }, 
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Email atau password salah' 
        }, 
        { status: 401 }
      )
    }

    // Generate JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      nama: user.nama,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(secret)

    // Prepare organizations data
    const organizations = user.organizations.map(uo => ({
      id: uo.organization.id,
      nama: uo.organization.nama,
      slug: uo.organization.slug,
      deskripsi: uo.organization.deskripsi,
      // OrganizationAdmin doesn't have a role field, use user's main role
      role: user.role,
    }))

    return NextResponse.json({
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        user: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          role: user.role,
          organizations,
        }
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan server' 
      }, 
      { status: 500 }
    )
  }
}
