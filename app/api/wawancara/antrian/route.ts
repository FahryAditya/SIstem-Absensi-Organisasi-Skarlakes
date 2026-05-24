import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canAccessMpk, canAccessOsis, getSessionFromRequest } from '@/lib/auth'
import type { AntrianWawancara } from '@prisma/client'
import { pusherServer } from '@/lib/pusher-server'
import { z } from 'zod'

async function updateIpInfo(antrianId: number, sesiId: number, ip: string) {
  try {
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      await prisma.antrianWawancara.update({
        where: { id: antrianId },
        data: { ip_status: 'NORMAL', ip_country: 'Indonesia', ip_isp: 'Local Network' },
      })
      return
    }
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,isp,proxy,hosting,query`)
    const json = await res.json().catch(() => null)
    if (!json || json.status !== 'success') return
    const foreignIp = !!(json.country && json.country.toLowerCase() !== 'indonesia')
    const proxy = Boolean(json.proxy || json.hosting)
    const ipStatus: AntrianWawancara['ip_status'] = foreignIp ? 'VPN_LUAR_NEGERI' : proxy ? 'VPN_INDONESIA' : json.country ? 'NORMAL' : 'TIDAK_DIKETAHUI'
    await prisma.antrianWawancara.update({
      where: { id: antrianId },
      data: { ip_status: ipStatus, ip_country: json.country ?? null, ip_isp: json.isp ?? null },
    })
  } catch { /* silent – non-critical enrichment */ }
}

async function getCtx(req: NextRequest) {
  const role = req.headers.get('x-user-role')
  if (role) {
    return { userRole: role }
  }
  const session = await getSessionFromRequest(req)
  return {
    userRole: session?.role || '',
  }
}

function canAccessInterview(role: string, org: string) {
  if (org === 'osis') return canAccessOsis(role)
  if (org === 'mpk') return canAccessMpk(role)
  return false
}

const enqueueSchema = z.object({
  sesi_id: z.number().int().positive().optional(),
  token: z.string().min(1, 'Token QR wajib diisi').optional(),
  nama: z.string().min(1, 'Nama wajib diisi'),
  kelas: z.string().min(1, 'Kelas wajib diisi'),
  organisasi: z.enum(['osis', 'mpk'], { required_error: 'Pilih organisasi tujuan' }),
  manual: z.boolean().optional(),
})

function getIp(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for')
  return (forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip')) || '127.0.0.1'
}

function validateNama(nama: string): string | null {
  const trimmed = nama.trim()
  if (!trimmed) {
    return 'Nama tidak boleh kosong atau hanya berisi spasi'
  }
  if (trimmed.length > 50) {
    return 'Nama terlalu panjang (maksimal 50 karakter)'
  }
  if (/\d/.test(trimmed)) {
    return 'Nama tidak boleh mengandung angka (seperti Fahry123 atau 1234Fahry)'
  }
  if (/(.)\1{3,}/i.test(trimmed)) {
    return 'Nama tidak boleh mengandung pengulangan karakter berturut-turut (spam)'
  }
  const namaRegex = /^[A-Za-z\s.'-]+$/
  if (!namaRegex.test(trimmed)) {
    return 'Nama hanya boleh berisi huruf, spasi, titik, dan tanda hubung/apostrof'
  }
  return null
}

export async function POST(req: NextRequest) {
  const parsed = enqueueSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const valError = validateNama(parsed.data.nama)
  if (valError) {
    return NextResponse.json({ error: valError }, { status: 400 })
  }

  const ctx = await getCtx(req)
  const isAdmin = canAccessOsis(ctx.userRole) || canAccessMpk(ctx.userRole)
  const isManual = parsed.data.manual === true

  if (isManual && !isAdmin) {
    return NextResponse.json({ error: 'Hanya admin yang dapat menambah peserta secara manual' }, { status: 403 })
  }

  let qrId: number | null = null
  let statusValidasi: 'SAH' | 'SAH_DICURIGAI' | 'DITOLAK_VPN' = 'SAH'
  let alasan = 'Valid'
  let jarak: number | null = null

  if (!isManual) {
    if (!parsed.data.token) return NextResponse.json({ error: 'Token QR wajib diisi' }, { status: 400 })

    const qr = await prisma.qrWawancara.findUnique({ where: { token: parsed.data.token } })
    const now = new Date()
    if (!qr || !qr.aktif || qr.valid_from > now || qr.valid_until < now) {
      return NextResponse.json({ error: 'QR tidak aktif atau sudah expired' }, { status: 400 })
    }
    qrId = qr.id
  } else {
    alasan = 'Ditambahkan Manual oleh Admin'
    statusValidasi = 'SAH'
  }

  const sesi = await prisma.sesiWawancara.findFirst({
    where: { 
      status: 'ACTIVE'
    },
    orderBy: { created_at: 'desc' }
  })
  
  if (!sesi) {
    return NextResponse.json({ error: `Sesi wawancara tidak aktif` }, { status: 400 })
  }

  const nama = parsed.data.nama.trim()
  const kelas = parsed.data.kelas.trim()
  const previous = await prisma.antrianWawancara.findFirst({
    where: {
      sesi_id: sesi.id,
      nama,
      kelas,
    },
    orderBy: { created_at: 'desc' },
  })
  if (previous && previous.status_validasi !== 'DITOLAK_VPN' && !isManual) {
    return NextResponse.json({ error: 'Anda sudah melakukan scan. Scan ulang hanya diizinkan jika sebelumnya ditolak karena VPN.' }, { status: 409 })
  }

  const ip = getIp(req)



  const alloc = async (): Promise<AntrianWawancara> => {
    const maxQueue = await prisma.antrianWawancara.aggregate({
      where: { sesi_id: sesi.id },
      _max: { nomor_antrian: true },
    })
    const nextNum = (maxQueue._max.nomor_antrian || 0) + 1
    return prisma.antrianWawancara.create({
      data: {
        sesi_id: sesi.id,
        qr_id: qrId,
        nama,
        kelas,
        nomor_antrian: nextNum,
        scan_token: parsed.data.token || null,
        ip_address: ip,
        ip_status: 'TIDAK_DIKETAHUI',
        gps_lat: null,
        gps_lng: null,
        jarak_meter: null,
        status_validasi: statusValidasi,
        alasan_validasi: alasan,
        user_agent: req.headers.get('user-agent')?.slice(0, 255),
      },
    })
  }

  let created: AntrianWawancara
  try {
    created = await alloc()
  } catch (e: any) {
    if (e?.code === 'P2002') {
      created = await alloc()
    } else {
      throw e
    }
  }

  if (!isManual) {
    ;(async () => { try { await updateIpInfo(created.id, sesi.id, ip) } catch {} })()
  }

  if (pusherServer) {
    try {
      await pusherServer.trigger(`wawancara-${sesi.id}`, 'queue-updated', {
        action: 'add',
        data: created,
      })
    } catch (err) {
      console.error('Failed to trigger Pusher for wawancara antrian add:', err)
    }
  }

  return NextResponse.json({ data: created }, { status: 201 })
}


export async function PATCH(req: NextRequest) {
  const ctx = await getCtx(req)
  const body = await req.json()
  const id = parseInt(body.id || '0')
  const status = body.status as 'MENUNGGU' | 'WAWANCARA' | 'SELESAI_WAWANCARA'
  if (!id || !['MENUNGGU', 'WAWANCARA', 'SELESAI_WAWANCARA'].includes(status)) {
    return NextResponse.json({ error: 'Data antrian tidak valid' }, { status: 400 })
  }

  const existing = await prisma.antrianWawancara.findUnique({
    where: { id },
    include: { sesi: true },
  })
  if (!existing) return NextResponse.json({ error: 'Antrian tidak ditemukan' }, { status: 404 })
  if (!canAccessInterview(ctx.userRole, existing.sesi.organisasi_type)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }
  if (existing.sesi.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Sesi tidak aktif atau sudah terkunci' }, { status: 400 })
  }
  if (status === 'WAWANCARA' && existing.status !== 'MENUNGGU') {
    return NextResponse.json({ error: 'Peserta ini sedang/sudah diwawancarai admin lain' }, { status: 409 })
  }
  if (status === 'MENUNGGU' && existing.status === 'SELESAI_WAWANCARA') {
    return NextResponse.json({ error: 'Peserta yang sudah selesai tidak bisa dikembalikan ke antrian' }, { status: 400 })
  }

  const data = await prisma.antrianWawancara.update({ where: { id }, data: { status } })

  if (pusherServer) {
    try {
      await pusherServer.trigger(`wawancara-${existing.sesi.id}`, 'queue-updated', {
        action: 'update',
        data,
      })
    } catch (err) {
      console.error('Failed to trigger Pusher for wawancara antrian update:', err)
    }
  }

  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const ctx = await getCtx(req)
  if (ctx.userRole !== 'administrator') {
    return NextResponse.json({ error: 'Akses ditolak. Hanya administrator.' }, { status: 403 })
  }

  const url = new URL(req.url)
  const idsParam = url.searchParams.get('ids')
  if (!idsParam) {
    return NextResponse.json({ error: 'Parameter ids tidak ditemukan' }, { status: 400 })
  }

  const ids = idsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
  if (ids.length === 0) {
    return NextResponse.json({ error: 'Daftar ID tidak valid' }, { status: 400 })
  }

  const result = await prisma.antrianWawancara.deleteMany({
    where: { id: { in: ids } },
  })

  if (pusherServer) {
    try {
      const activeSesi = await prisma.sesiWawancara.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { created_at: 'desc' }
      })
      if (activeSesi) {
        await pusherServer.trigger(`wawancara-${activeSesi.id}`, 'queue-updated', {
          action: 'delete',
          ids,
        })
      }
    } catch (err) {
      console.error('Failed to trigger Pusher for wawancara antrian delete:', err)
    }
  }

  return NextResponse.json({ success: true, count: result.count })
}
