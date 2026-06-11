import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'administrator') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { targetUserId, adminPassword } = await req.json()

  // 1. Verifikasi password admin sendiri
  const admin = await prisma.user.findUnique({ where: { id: session.id } })
  if (!admin || !await bcrypt.compare(adminPassword, admin.password)) {
    return NextResponse.json({ error: 'Password administrator salah' }, { status: 403 })
  }

  // 2. Ambil password target user
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { password: true }
  })

  if (!targetUser) {
    return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
  }

  // 3. Kembalikan hash (Note: password asli tidak bisa didapatkan dari hash bcrypt)
  // Re-evaluating: Bcrypt is one-way. We CANNOT get the original password back.
  // I must inform the user about this limitation.
  
  return NextResponse.json({ 
    error: 'Password asli tidak dapat dipulihkan karena tersimpan dalam format hash satu arah. Silakan reset password user jika diperlukan.' 
  }, { status: 400 })
}
