import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userRole: (req.headers.get('x-user-role') || '').trim(),
  }
}

// GET: Ambil konfigurasi email pengirim saat ini
export async function GET(req: NextRequest) {
  try {
    const ctx = getCtx(req)
    if (!ctx.userId || ctx.userRole !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const setting = await prisma.emailSetting.findFirst()

    return NextResponse.json({
      success: true,
      data: setting
        ? { id: setting.id, email: setting.email, appPassword: maskPassword(setting.appPassword) }
        : null,
    })
  } catch (error: any) {
    console.error('Get email setting error:', error)
    return NextResponse.json({ error: 'Gagal mengambil pengaturan email: ' + error.message }, { status: 500 })
  }
}

// POST: Simpan / update konfigurasi email pengirim
export async function POST(req: NextRequest) {
  try {
    const ctx = getCtx(req)
    if (!ctx.userId || ctx.userRole !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { email, appPassword } = body

    if (!email || !appPassword) {
      return NextResponse.json({ error: 'Email dan App Password wajib diisi' }, { status: 400 })
    }

    // Validasi format email sederhana
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 })
    }

    // Cek apakah sudah ada setting
    const existing = await prisma.emailSetting.findFirst()

    let setting
    if (existing) {
      setting = await prisma.emailSetting.update({
        where: { id: existing.id },
        data: { email, appPassword },
      })
    } else {
      setting = await prisma.emailSetting.create({
        data: { email, appPassword },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Pengaturan email berhasil disimpan',
      data: { id: setting.id, email: setting.email },
    })
  } catch (error: any) {
    console.error('Save email setting error:', error)
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan email: ' + error.message }, { status: 500 })
  }
}

function maskPassword(password: string): string {
  if (password.length <= 4) return '****'
  return password.slice(0, 2) + '●'.repeat(password.length - 4) + password.slice(-2)
}
