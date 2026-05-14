import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { canAccessMpk, canAccessOsis, isAdministrator } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

type CacheEntry = {
  expiresAt: number
  payload: unknown
}

const getCache = new Map<string, CacheEntry>()
let lastAutoActivationCheck = 0
const AUTO_ACTIVATION_INTERVAL_MS = 30_000
const ACTIVE_CACHE_TTL_MS = 5_000
const HISTORY_CACHE_TTL_MS = 30_000

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

function canAccessInterview(role: string, org: string) {
  if (org === 'osis') return canAccessOsis(role)
  if (org === 'mpk') return canAccessMpk(role)
  return false
}

async function processScheduledSessions() {
  const checkedAt = Date.now()
  if (checkedAt - lastAutoActivationCheck < AUTO_ACTIVATION_INTERVAL_MS) return
  lastAutoActivationCheck = checkedAt

  const now = new Date()
  
  // Activate scheduled sessions
  await prisma.sesiWawancara.updateMany({
    where: {
      status: 'SCHEDULED',
      jadwal_mulai: { not: null, lte: now },
      OR: [{ jadwal_selesai: null }, { jadwal_selesai: { gt: now } }],
    },
    data: { status: 'ACTIVE' },
  })
  
  // Auto finish expired active sessions
  await prisma.sesiWawancara.updateMany({
    where: {
      status: 'ACTIVE',
      jadwal_selesai: { not: null, lte: now },
    },
    data: { status: 'SELESAI', finalized_at: now, locked_at: now },
  })
}

const sessionSchema = z.object({
  organisasi_type: z.enum(['osis', 'mpk']).optional(),
  jadwal_mulai: z.string().nullable().optional(),
  jadwal_selesai: z.string().nullable().optional(),
})

export async function GET(req: NextRequest) {
  const ctx = getCtx(req)
  const { searchParams } = new URL(req.url)
  const org = searchParams.get('org') || ''
  const activeOnly = searchParams.get('activeOnly') === '1'
  const hasil = searchParams.get('hasil') || ''
  const kelas = searchParams.get('kelas') || ''
  const validasi = searchParams.get('validasi') || ''
  const refresh = searchParams.get('refresh') === '1'

  await processScheduledSessions()

  if (org && org !== 'all' && !canAccessInterview(ctx.userRole, org)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  const orgs = org && org !== 'all' ? [org] : ['osis', 'mpk'].filter((o) => canAccessInterview(ctx.userRole, o))
  const cacheKey = JSON.stringify({ role: ctx.userRole, orgs, activeOnly, hasil, kelas, validasi })
  const cached = getCache.get(cacheKey)
  if (!refresh && cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.payload)
  }

  if (activeOnly) {
    const sessions = await prisma.sesiWawancara.findMany({
      where: {
        organisasi_type: { in: orgs as any[] },
        status: 'ACTIVE',
      },
      select: { id: true, status: true, organisasi_type: true },
      orderBy: { created_at: 'desc' },
    })
    const payload = { data: sessions }
    getCache.set(cacheKey, { payload, expiresAt: Date.now() + ACTIVE_CACHE_TTL_MS })
    return NextResponse.json(payload)
  }

  const sessions = await prisma.sesiWawancara.findMany({
    where: {
      organisasi_type: { in: orgs as any[] },
      ...(activeOnly ? { status: 'ACTIVE' as const } : {}),
    },
    include: {
      creator: { select: { nama: true } },
      antrian: {
        where: {
          ...(validasi ? { status_validasi: validasi as any } : {}),
          ...(kelas ? { kelas: { contains: kelas } } : {}),
          ...(hasil ? { hasil_wawancara: { hasil: hasil as any } } : {}),
        },
        include: {
          hasil_wawancara: {
            include: {
              interviewer: { select: { nama: true } },
              overrider: { select: { nama: true } },
            },
          },
        },
        orderBy: { nomor_antrian: 'asc' },
      },
    },
    orderBy: [{ status: 'asc' }, { created_at: 'desc' }],
  })

  const payload = { data: sessions }
  getCache.set(cacheKey, {
    payload,
    expiresAt: Date.now() + (activeOnly || sessions.some((s) => s.status === 'ACTIVE') ? ACTIVE_CACHE_TTL_MS : HISTORY_CACHE_TTL_MS),
  })

  return NextResponse.json(payload)
}

export async function POST(req: NextRequest) {
  const ctx = getCtx(req)
  if (!isAdministrator(ctx.userRole)) {
    return NextResponse.json({ error: 'Hanya Administrator yang dapat membuat sesi' }, { status: 403 })
  }

  const parsed = sessionSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const activeOrScheduled = await prisma.sesiWawancara.findFirst({
    where: {
      organisasi_type: { in: ['osis', 'mpk'] },
      status: { in: ['SCHEDULED', 'ACTIVE'] },
    },
  })
  if (activeOrScheduled) {
    return NextResponse.json({ error: 'Masih ada sesi wawancara OSIS & MPK yang terjadwal/aktif' }, { status: 400 })
  }

  const now = new Date()
  const mulai = parsed.data.jadwal_mulai ? new Date(parsed.data.jadwal_mulai) : now
  const selesai = parsed.data.jadwal_selesai ? new Date(parsed.data.jadwal_selesai) : null
  const status = mulai <= now && (!selesai || selesai > now) ? 'ACTIVE' : 'SCHEDULED'

  const session = await prisma.sesiWawancara.create({
    data: {
      organisasi_type: parsed.data.organisasi_type || 'osis',
      jadwal_mulai: mulai,
      jadwal_selesai: selesai,
      status,
      created_by: ctx.userId,
    },
  })

  await createLog({
    userId: ctx.userId,
    userNama: ctx.userNama,
    aksi: 'CREATE',
    tabel: 'sesi_wawancara',
    recordId: session.id,
    deskripsi: `${ctx.userNama} membuat sesi wawancara OSIS & MPK (${session.status})`,
    dataBaru: session as any,
    ipAddress: getIp(req),
  })

  getCache.clear()
  return NextResponse.json({ data: session }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const ctx = getCtx(req)
  if (!isAdministrator(ctx.userRole)) {
    return NextResponse.json({ error: 'Hanya Administrator yang dapat mengubah sesi' }, { status: 403 })
  }

  const body = await req.json()
  const id = parseInt(body.id || '0')
  const action = body.action as string | undefined
  if (!id) return NextResponse.json({ error: 'ID sesi wajib diisi' }, { status: 400 })

  const existing = await prisma.sesiWawancara.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 })
  if (existing.status === 'SELESAI' || existing.status === 'DIBATALKAN') {
    return NextResponse.json({ error: 'Sesi sudah terkunci dan tidak bisa diubah' }, { status: 400 })
  }

  let data: any = {}

  if (action === 'activate') {
    data = { status: 'ACTIVE', jadwal_mulai: existing.jadwal_mulai || new Date() }
  } else if (action === 'finish') {
    data = { status: 'SELESAI', finalized_at: new Date(), locked_at: new Date() }
  } else if (action === 'cancel') {
    data = { status: 'DIBATALKAN', locked_at: new Date() }
  } else {
    const parsed = sessionSchema.partial().safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    if (existing.status === 'ACTIVE') {
      data = { jadwal_selesai: parsed.data.jadwal_selesai ? new Date(parsed.data.jadwal_selesai) : existing.jadwal_selesai }
    } else {
      data = {
        organisasi_type: existing.organisasi_type,
        jadwal_mulai: parsed.data.jadwal_mulai ? new Date(parsed.data.jadwal_mulai) : existing.jadwal_mulai,
        jadwal_selesai: parsed.data.jadwal_selesai ? new Date(parsed.data.jadwal_selesai) : existing.jadwal_selesai,
      }
    }
  }

  const updated = await prisma.sesiWawancara.update({ where: { id }, data })
  await createLog({
    userId: ctx.userId,
    userNama: ctx.userNama,
    aksi: 'UPDATE',
    tabel: 'sesi_wawancara',
    recordId: id,
    deskripsi: `${ctx.userNama} mengubah sesi wawancara OSIS & MPK menjadi ${updated.status}`,
    dataLama: existing as any,
    dataBaru: updated as any,
    ipAddress: getIp(req),
  })

  getCache.clear()
  return NextResponse.json({ data: updated })
}
