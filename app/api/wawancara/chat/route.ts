import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canAccessMpk, canAccessOsis } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

type CacheEntry = {
  expiresAt: number
  payload: unknown
}

const chatCache = new Map<string, CacheEntry>()
const CHAT_CACHE_TTL_MS = 3_000

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userRole: req.headers.get('x-user-role') || '',
  }
}

function canAccessInterview(role: string, org: string) {
  if (org === 'osis') return canAccessOsis(role)
  if (org === 'mpk') return canAccessMpk(role)
  return false
}

const chatSchema = z.object({
  sesi_id: z.number().int().positive(),
  pesan: z.string().min(1, 'Pesan wajib diisi').max(1000, 'Pesan maksimal 1000 karakter'),
})

export async function GET(req: NextRequest) {
  const ctx = getCtx(req)
  const { searchParams } = new URL(req.url)
  const sesiId = parseInt(searchParams.get('sesiId') || '0')
  const sinceId = parseInt(searchParams.get('sinceId') || '0')
  if (!sesiId) return NextResponse.json({ error: 'ID sesi wajib diisi' }, { status: 400 })

  const cacheKey = JSON.stringify({ role: ctx.userRole, sesiId, sinceId })
  const cached = chatCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.payload)
  }

  const sesi = await prisma.sesiWawancara.findUnique({ where: { id: sesiId } })
  if (!sesi) return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 })
  if (!canAccessInterview(ctx.userRole, sesi.organisasi_type)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }
  if (sesi.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Live chat hanya tersedia saat wawancara aktif' }, { status: 400 })
  }

  const data = await prisma.chatWawancara.findMany({
    where: {
      sesi_id: sesiId,
      ...(sinceId ? { id: { gt: sinceId } } : {}),
    },
    include: { sender: { select: { id: true, nama: true, role: true } } },
    orderBy: { created_at: 'asc' },
    take: sinceId ? 50 : 100,
  })

  const payload = { data }
  chatCache.set(cacheKey, { payload, expiresAt: Date.now() + CHAT_CACHE_TTL_MS })
  return NextResponse.json(payload)
}

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

  chatCache.clear()
  return NextResponse.json({ data }, { status: 201 })
}
