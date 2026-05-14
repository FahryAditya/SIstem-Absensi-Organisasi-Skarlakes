import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canAccessMpk, canAccessOsis } from '@/lib/auth'
import { z } from 'zod'

function getCtx(req: NextRequest) {
  return {
    userRole: req.headers.get('x-user-role') || '',
  }
}

function canAccessInterview(role: string, org: string) {
  if (org === 'osis') return canAccessOsis(role)
  if (org === 'mpk') return canAccessMpk(role)
  return false
}

const enqueueSchema = z.object({
  sesi_id: z.number().int().positive().optional(),
  token: z.string().min(1, 'Token QR wajib diisi'),
  nama: z.string().min(1, 'Nama wajib diisi'),
  kelas: z.string().min(1, 'Kelas wajib diisi'),
  latitude: z.number(),
  longitude: z.number(),
})

const SCHOOL_LAT = parseFloat(process.env.SCHOOL_LAT || process.env.NEXT_PUBLIC_SCHOOL_LAT || '-1.251278')
const SCHOOL_LNG = parseFloat(process.env.SCHOOL_LNG || process.env.NEXT_PUBLIC_SCHOOL_LNG || '116.838333')
const SCHOOL_RADIUS_M = parseFloat(process.env.SCHOOL_RADIUS_M || process.env.NEXT_PUBLIC_SCHOOL_RADIUS_M || '50')

function getIp(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for')
  return (forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip')) || '127.0.0.1'
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180
  const r = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function lookupIp(ip: string) {
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { country: 'Indonesia', isp: 'Local Network', proxy: false }
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,isp,proxy,hosting,query`, {
      next: { revalidate: 60 * 60 },
    })
    const json = await res.json()
    if (json.status !== 'success') return { country: null, isp: null, proxy: false }
    return { country: json.country as string | null, isp: json.isp as string | null, proxy: Boolean(json.proxy || json.hosting) }
  } catch {
    return { country: null, isp: null, proxy: false }
  }
}

export async function POST(req: NextRequest) {
  const parsed = enqueueSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const qr = await prisma.qrWawancara.findUnique({ where: { token: parsed.data.token }, include: { sesi: true } })
  const now = new Date()
  if (!qr || !qr.aktif || qr.valid_from > now || qr.valid_until < now) {
    return NextResponse.json({ error: 'QR tidak aktif atau sudah expired' }, { status: 400 })
  }

  const sesi = qr.sesi
  if (!sesi || sesi.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Sesi wawancara tidak aktif' }, { status: 400 })
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
  if (previous && previous.status_validasi !== 'DITOLAK_VPN') {
    return NextResponse.json({ error: 'Anda sudah melakukan scan. Scan ulang hanya diizinkan jika sebelumnya ditolak karena VPN.' }, { status: 409 })
  }

  const ip = getIp(req)
  const ipInfo = await lookupIp(ip)
  const jarak = haversineMeters(parsed.data.latitude, parsed.data.longitude, SCHOOL_LAT, SCHOOL_LNG)
  const outsideRadius = jarak > SCHOOL_RADIUS_M
  const foreignIp = !!ipInfo.country && ipInfo.country.toLowerCase() !== 'indonesia'
  const proxy = ipInfo.proxy
  const ipStatus = foreignIp ? 'VPN_LUAR_NEGERI' : proxy ? 'VPN_INDONESIA' : ipInfo.country ? 'NORMAL' : 'TIDAK_DIKETAHUI'
  const statusValidasi = outsideRadius ? 'TIDAK_SAH' : ipStatus === 'VPN_LUAR_NEGERI' ? 'DITOLAK_VPN' : ipStatus === 'VPN_INDONESIA' ? 'SAH_DICURIGAI' : 'SAH'
  const alasan = outsideRadius
    ? `Jarak ${Math.round(jarak)}m dari sekolah`
    : ipStatus === 'VPN_LUAR_NEGERI'
      ? 'VPN/Proxy luar negeri terdeteksi'
      : ipStatus === 'VPN_INDONESIA'
        ? 'VPN/Proxy Indonesia terdeteksi'
        : 'Valid'

  if (statusValidasi === 'DITOLAK_VPN' || statusValidasi === 'TIDAK_SAH') {
    const rejectedCount = await prisma.antrianWawancara.count({
      where: { sesi_id: sesi.id, status_validasi: { in: ['DITOLAK_VPN', 'TIDAK_SAH'] } },
    })
    const rejected = await prisma.antrianWawancara.create({
      data: {
        sesi_id: sesi.id,
        qr_id: qr.id,
        nama,
        kelas,
        nomor_antrian: -(rejectedCount + 1),
        scan_token: parsed.data.token,
        ip_address: ip,
        ip_country: ipInfo.country || undefined,
        ip_isp: ipInfo.isp || undefined,
        ip_status: ipStatus,
        gps_lat: parsed.data.latitude,
        gps_lng: parsed.data.longitude,
        jarak_meter: jarak,
        status_validasi: statusValidasi,
        alasan_validasi: alasan,
        user_agent: req.headers.get('user-agent')?.slice(0, 255),
      },
    })
    return NextResponse.json({ error: alasan, data: rejected }, { status: 400 })
  }

  const maxQueue = await prisma.antrianWawancara.aggregate({
    where: { sesi_id: sesi.id },
    _max: { nomor_antrian: true },
  })

  const data = await prisma.antrianWawancara.create({
    data: {
      sesi_id: sesi.id,
      qr_id: qr.id,
      nama,
      kelas,
      nomor_antrian: (maxQueue._max.nomor_antrian || 0) + 1,
      scan_token: parsed.data.token,
      ip_address: ip,
      ip_country: ipInfo.country || undefined,
      ip_isp: ipInfo.isp || undefined,
      ip_status: ipStatus,
      gps_lat: parsed.data.latitude,
      gps_lng: parsed.data.longitude,
      jarak_meter: jarak,
      status_validasi: statusValidasi,
      alasan_validasi: alasan,
      user_agent: req.headers.get('user-agent')?.slice(0, 255),
    },
  })

  return NextResponse.json({ data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const ctx = getCtx(req)
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
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const ctx = getCtx(req)
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

  return NextResponse.json({ success: true, count: result.count })
}
