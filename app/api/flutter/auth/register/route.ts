import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: parsed.error.errors[0].message 
        }, 
        { status: 400 }
      )
    }

    const { nama, email, password } = parsed.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Email sudah terdaftar' 
        }, 
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        nama,
        email,
        password: hashedPassword,
        role: 'USER', // Default role
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan server' 
      }, 
      { status: 500 }
    )
  }
}
