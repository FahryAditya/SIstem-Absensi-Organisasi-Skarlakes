import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canAccessMpk, canAccessOsis } from '@/lib/auth'
import { formatDateTime } from '@/lib/utils'
import * as XLSX from 'xlsx'

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

const ketLabel: Record<string, string> = {
  AKTIF: 'Aktif',
  KURANG_AKTIF: 'Kurang Aktif',
}

const hasilLabel: Record<string, string> = {
  LOLOS: 'Lolos',
  TIDAK_LOLOS: 'Tidak Lolos',
  PENDING: 'Pending',
}

export async function GET(req: NextRequest) {
  const ctx = getCtx(req)
  const { searchParams } = new URL(req.url)
  const sesiId = parseInt(searchParams.get('sesiId') || '0')
  const org = searchParams.get('org')

  let antrian: any[] = []
  let filename = 'hasil_wawancara.xlsx'
  let orgTitle = 'Organisasi'

  if (sesiId) {
    const sesi = await prisma.sesiWawancara.findUnique({
      where: { id: sesiId },
      include: {
        antrian: {
          include: {
            hasil_wawancara: { include: { interviewer: { select: { nama: true } } } },
          },
          orderBy: { nomor_antrian: 'asc' },
        },
      },
    })
    if (!sesi) return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 })
    if (!canAccessInterview(ctx.userRole, sesi.organisasi_type)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }
    antrian = sesi.antrian
    filename = `hasil_wawancara_${sesi.organisasi_type}_sesi_${sesi.id}.xlsx`
    orgTitle = sesi.organisasi_type.toUpperCase()
  } else if (org === 'osis' || org === 'mpk') {
    if (!canAccessInterview(ctx.userRole, org)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }
    antrian = await prisma.antrianWawancara.findMany({
      where: org === 'mpk'
        ? { kelas: { startsWith: '[MPK]' } }
        : { NOT: { kelas: { startsWith: '[MPK]' } } },
      include: {
        hasil_wawancara: { include: { interviewer: { select: { nama: true } } } },
      },
      orderBy: { created_at: 'asc' },
    })
    filename = `rekap_wawancara_${org}.xlsx`
    orgTitle = org.toUpperCase()
  } else {
    return NextResponse.json({ error: 'ID sesi atau Organisasi wajib diisi' }, { status: 400 })
  }

  const rows = antrian.map((a, i) => {
    const candidateOrg = a.kelas.startsWith('[MPK]') ? 'MPK' : a.kelas.startsWith('[OSIS]') ? 'OSIS' : orgTitle
    const cleanKelas = a.kelas.replace(/^\[(OSIS|MPK)\]\s*/i, '')
    return {
      No: i + 1,
      'Organisasi': candidateOrg,
      'Nomor Antrian': a.nomor_antrian,
      Nama: a.nama,
      Kelas: cleanKelas,
      Keterangan: a.hasil_wawancara ? ketLabel[a.hasil_wawancara.keterangan] : '-',
      Hasil: a.hasil_wawancara ? hasilLabel[a.hasil_wawancara.hasil] : '-',
      Persentase: a.hasil_wawancara?.persentase ?? '-',
      Catatan: a.hasil_wawancara?.catatan || '-',
      Interviewer: a.hasil_wawancara?.interviewer?.nama || '-',
      'Waktu Daftar': formatDateTime(a.created_at),
      'Status Kehadiran': a.status_validasi,
      'Status IP': a.ip_status,
      'IP Address': a.ip_address || '-',
      'Negara IP': a.ip_country || '-',
      'GPS': a.gps_lat && a.gps_lng ? `${a.gps_lat}, ${a.gps_lng}` : '-',
      'Jarak Meter': a.jarak_meter ? Math.round(a.jarak_meter) : '-',
      'Token QR': a.scan_token || '-',
    }
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows, {
    header: ['No', 'Organisasi', 'Nomor Antrian', 'Nama', 'Kelas', 'Keterangan', 'Hasil', 'Persentase', 'Catatan', 'Interviewer', 'Waktu Daftar', 'Status Kehadiran', 'Status IP', 'IP Address', 'Negara IP', 'GPS', 'Jarak Meter', 'Token QR'],
  })
  ws['!cols'] = [5, 12, 14, 28, 14, 16, 14, 12, 30, 22, 22, 18, 18, 18, 18, 28, 12, 28].map((wch) => ({ wch }))
  XLSX.utils.book_append_sheet(wb, ws, 'Hasil Wawancara')

  const output = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })

  return new NextResponse(output, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
