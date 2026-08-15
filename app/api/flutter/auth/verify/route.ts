import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Token tidak valid' 
        }, 
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

    try {
      const { payload } = await jwtVerify(token, secret)
      
      // Get fresh user data
      const user = await prisma.user.findUnique({
        where: { id: payload.userId as number },
        select: {
          id: true,
          nama: true,
          email: true,
          role: true,
        }
      })

      if (!user) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'User tidak ditemukan' 
          }, 
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Token valid',
        data: {
          user,
          tokenPayload: payload,
        }
      })

    } catch (jwtError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Token expired atau tidak valid' 
        }, 
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan server' 
      }, 
      { status: 500 }
    )
  }
}
