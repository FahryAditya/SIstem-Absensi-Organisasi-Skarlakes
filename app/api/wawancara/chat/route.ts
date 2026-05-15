import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canAccessMpk, canAccessOsis } from '@/lib/auth'
import { z } from 'zod'
import { pusherServer } from '@/lib/pusher-server'

export const dynamic = 'force-dynamic'

// ── Helpers ───────────────────────────────────────────────────────────────
function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userRole: req.headers.get('x-user-role') || '',
  }
}

function canAccessInterview(role: string, org: string) {
  if (role === 'administrator') return true
  if (org === 'osis') return canAccessOsis(role)
  if (org === 'mpk') return canAccessMpk(role)
  return false
}

const chatSchema = z.object({
  sesi_id: z.number().int().positive(),
  pesan: z.string().min(1, 'Pesan wajib diisi').max(1000, 'Pesan maksimal 1000 karakter'),
})

// ── GET ───────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const ctx = getCtx(req)
  const { searchParams } = new URL(req.url)
  const sesiId = parseInt(searchParams.get('sesiId') || '0')
  const sinceId = parseInt(searchParams.get('sinceId') || '0')
  if (!sesiId) return NextResponse.json({ error: 'ID sesi wajib diisi' }, { status: 400 })

  const sesi = await prisma.sesiWawancara.findUnique({ where: { id: sesiId } })
  if (!sesi) return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 })
  if (!canAccessInterview(ctx.userRole, sesi.organisasi_type)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }
  if (sesi.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Live chat hanya tersedia saat wawancara aktif' }, { status: 400 })
  }

  // Polling mode: initial page-load / history fetch
  const data = await prisma.chatWawancara.findMany({
    where: {
      sesi_id: sesiId,
      ...(sinceId ? { id: { gt: sinceId } } : {}),
    },
    include: { sender: { select: { id: true, nama: true, role: true } } },
    orderBy: { created_at: 'asc' },
    take: sinceId ? 50 : 100,
  })

  return NextResponse.json({ data })
}

// ── POST ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ctx = getCtx(req)
  const parsed = chatSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const sesi = await prisma.sesiWawancara.findUnique({ where: { id: parsed.data.sesi_id } })
  if (!sesi) return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 })
  if (!canAccessInterview(ctx.userRole, sesi.organisasi_type)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }
  if (sesi.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Live chat hanya tersedia saat wawancara aktif' }, { status: 400 })
  }

  const data = await prisma.chatWawancara.create({
    data: {
      sesi_id: parsed.data.sesi_id,
      sender_id: ctx.userId,
      pesan: parsed.data.pesan.trim(),
    },
    include: { sender: { select: { id: true, nama: true, role: true } } },
  })

  // Trigger Pusher event — robust and works across multiple server instances.
  // This is non-blocking to keep the response fast.
  if (pusherServer) {
    try {
      await pusherServer.trigger(`chat-${parsed.data.sesi_id}`, 'incoming-chat', data)
    } catch (err) {
      console.error('Pusher trigger failed:', err)
    }
  }

  return NextResponse.json({ data }, { status: 201 })
}

