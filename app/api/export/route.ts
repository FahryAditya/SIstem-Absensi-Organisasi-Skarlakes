import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessibleOrgs, ROLE_LABELS } from '@/lib/auth-shared'
import { ORG_LABELS, STATUS_LABELS, formatCurrency, formatDate } from '@/lib/utils'
import { createLog, getIp } from '@/lib/log'
import * as XLSX from 'xlsx'

type Org = 'programming' | 'english' | 'osis' | 'mpk'
type ExportType = 'admin' | 'absensi' | 'kas' | 'kehadiran' | 'absensi_kehadiran' | 'semua' | 'siswa' | 'absensi_ekskul' | 'absensi_organisasi' | 'rekap_siswa'

const EXPORT_LABELS: Record<string, string> = {
  admin: 'Data Admin',
  absensi: 'Absensi',
  kas: 'Kas',
  kehadiran: 'Kehadiran',
  absensi_kehadiran: 'Absensi + Kehadiran',
  semua: 'Semua Data',
  siswa: 'Data Anggota',
  absensi_ekskul: 'Absensi',
  absensi_organisasi: 'Absensi',
  rekap_siswa: 'Kehadiran',
}

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

function parseDateRange(startDate: string, endDate: string) {
  if (!startDate || !endDate) return null
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T23:59:59`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  if (start > end) return null
  return { start, end }
}

function safeSheetName(name: string) {
  return name.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31)
}

function appendJsonSheet(wb: XLSX.WorkBook, rows: Record<string, unknown>[], name: string, widths: number[]) {
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Info: 'Tidak ada data untuk filter ini' }])
  ws['!cols'] = widths.map(w => ({ wch: w }))
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName(name))
}

function dateWhere(range: { start: Date; end: Date }) {
  return { tanggal: { gte: range.start, lte: range.end } }
}

function memberWhere(kelas: string, nama: string) {
  return {
    ...(kelas ? { kelas } : {}),
    ...(nama ? { nama: { contains: nama } } : {}),
  }
}

async function buildAbsensiRows(orgs: Org[], range: { start: Date; end: Date }, kelas: string, nama: string) {
  const rows: Record<string, unknown>[] = []
  const uniqueOrgs = Array.from(new Set(orgs))

  for (const org of uniqueOrgs) {
    if (org === 'programming' || org === 'english') {
      const data = await prisma.absensi.findMany({
        where: { ...dateWhere(range), siswa: { ekskul: org, ...memberWhere(kelas, nama) } },
        include: { siswa: true, creator: { select: { nama: true } } },
        orderBy: [{ tanggal: 'asc' }, { siswa: { nama: 'asc' } }],
      })
      data.forEach((a) => rows.push({
        No: rows.length + 1,
        Tanggal: formatDate(a.tanggal),
        Ekskul: ORG_LABELS[a.siswa.ekskul as Org],
        Nama: a.siswa.nama,
        Kelas: a.siswa.kelas || '-',
        Status: STATUS_LABELS[a.status] || a.status,
        Keterangan: a.keterangan || '-',
        'Di-input oleh': a.creator.nama,
      }))
    } else {
      const data = await prisma.absensiOrganisasi.findMany({
        where: {
          organisasi_type: org,
          ...dateWhere(range),
          ...(org === 'osis'
            ? { anggota_osis: memberWhere(kelas, nama) }
            : { anggota_mpk: memberWhere(kelas, nama) }),
        },
        include: { anggota_osis: true, anggota_mpk: true },
        orderBy: [
          { tanggal: 'asc' },
          { anggota_osis: { nama: 'asc' } },
          { anggota_mpk: { nama: 'asc' } }
        ],
      })
      data.forEach((a) => {
        const anggota = org === 'osis' ? a.anggota_osis : a.anggota_mpk
        if (!anggota) return // Skip if no member found (data integrity check)
        rows.push({
          No: rows.length + 1,
          Tanggal: formatDate(a.tanggal),
          Ekskul: ORG_LABELS[org],
          Nama: anggota.nama || '-',
          Kelas: anggota.kelas || '-',
          Status: STATUS_LABELS[a.status] || a.status,
          Keterangan: a.keterangan || '-',
          Jabatan: anggota.jabatan || '-',
        })
      })
    }
  }

  return rows
}

async function buildKasRows(orgs: Org[], range: { start: Date; end: Date }, kelas: string, nama: string) {
  const rows: Record<string, unknown>[] = []
  const uniqueOrgs = Array.from(new Set(orgs))

  for (const org of uniqueOrgs) {
    if (org === 'programming' || org === 'english') {
      const data = await prisma.absensi.findMany({
        where: { ...dateWhere(range), uang_kas: { not: 0 }, siswa: { ekskul: org, ...memberWhere(kelas, nama) } },
        include: { siswa: true, creator: { select: { nama: true } } },
        orderBy: [{ tanggal: 'asc' }, { siswa: { nama: 'asc' } }],
      })
      data.forEach((a) => rows.push({
        No: rows.length + 1,
        Tanggal: formatDate(a.tanggal),
        Ekskul: ORG_LABELS[org],
        Nama: a.siswa.nama,
        Kelas: a.siswa.kelas || '-',
        Jenis: a.uang_kas >= 0 ? 'Pemasukan' : 'Pengeluaran',
        Nominal: formatCurrency(a.uang_kas),
        Keterangan: a.keterangan || 'Setor uang kas',
        Petugas: a.creator.nama,
      }))
    } else {
      const data = await prisma.absensiOrganisasi.findMany({
        where: {
          organisasi_type: org,
          ...dateWhere(range),
          uang_kas: { not: 0 },
          ...(org === 'osis'
            ? { anggota_osis: memberWhere(kelas, nama) }
            : { anggota_mpk: memberWhere(kelas, nama) }),
        },
        include: { anggota_osis: true, anggota_mpk: true },
        orderBy: [
          { tanggal: 'asc' },
          { anggota_osis: { nama: 'asc' } },
          { anggota_mpk: { nama: 'asc' } }
        ],
      })
      data.forEach((a) => {
        const anggota = org === 'osis' ? a.anggota_osis : a.anggota_mpk
        if (!anggota) return
        rows.push({
          No: rows.length + 1,
          Tanggal: formatDate(a.tanggal),
          Ekskul: ORG_LABELS[org],
          Nama: anggota.nama || '-',
          Kelas: anggota.kelas || '-',
          Jenis: a.uang_kas >= 0 ? 'Pemasukan' : 'Pengeluaran',
          Nominal: formatCurrency(a.uang_kas),
          Keterangan: a.keterangan || 'Setor uang kas',
          Petugas: '-',
        })
      })
    }
  }

  const pengeluaran = await prisma.pengeluaranKas.findMany({
    where: { organisasi_type: { in: uniqueOrgs }, ...dateWhere(range) },
    include: { creator: { select: { nama: true } } },
    orderBy: { tanggal: 'asc' },
  })

  pengeluaran.forEach((p) => rows.push({
    No: rows.length + 1,
    Tanggal: formatDate(p.tanggal),
    Ekskul: ORG_LABELS[p.organisasi_type as Org],
    Nama: '-',
    Kelas: '-',
    Jenis: 'Pengeluaran',
    Nominal: formatCurrency(p.nominal),
    Keterangan: p.keterangan,
    Petugas: p.creator.nama,
  }))

  return rows
}

async function buildKehadiranRows(orgs: Org[], range: { start: Date; end: Date }, kelas: string, nama: string) {
  const rows: Record<string, unknown>[] = []
  const uniqueOrgs = Array.from(new Set(orgs))

  for (const org of uniqueOrgs) {
    if (org === 'programming' || org === 'english') {
      const members = await prisma.siswa.findMany({
        where: { ekskul: org, ...memberWhere(kelas, nama) },
        include: { absensi: { where: dateWhere(range) } },
        orderBy: { nama: 'asc' },
      })
      members.forEach((s) => {
        const meetings = s.absensi.filter(a => a.status !== 'kas_saja')
        const hadir = meetings.filter(a => a.status === 'hadir').length
        rows.push({
          No: rows.length + 1,
          Ekskul: ORG_LABELS[org],
          Nama: s.nama,
          Kelas: s.kelas || '-',
          'Total Pertemuan': meetings.length,
          Hadir: hadir,
          'Tidak Hadir': meetings.filter(a => a.status === 'tidak_hadir').length,
          Izin: meetings.filter(a => a.status === 'izin').length,
          Sakit: meetings.filter(a => a.status === 'sakit').length,
          'Persentase Kehadiran': meetings.length ? `${Math.round((hadir / meetings.length) * 100)}%` : '0%',
        })
      })
    } else {
      const members = org === 'osis'
        ? await prisma.anggotaOsis.findMany({
            where: memberWhere(kelas, nama),
            include: { absensi: { where: { organisasi_type: org, ...dateWhere(range) } } },
            orderBy: { nama: 'asc' },
          })
        : await prisma.anggotaMpk.findMany({
            where: memberWhere(kelas, nama),
            include: { absensi: { where: { organisasi_type: org, ...dateWhere(range) } } },
            orderBy: { nama: 'asc' },
          })

      members.forEach((a) => {
        const meetings = a.absensi.filter(x => x.status !== 'kas_saja')
        const hadir = meetings.filter(x => x.status === 'hadir').length
        rows.push({
          No: rows.length + 1,
          Ekskul: ORG_LABELS[org],
          Nama: a.nama,
          Kelas: a.kelas || '-',
          Jabatan: a.jabatan || '-',
          'Total Pertemuan': meetings.length,
          Hadir: hadir,
          'Tidak Hadir': meetings.filter(x => x.status === 'tidak_hadir').length,
          Izin: meetings.filter(x => x.status === 'izin').length,
          Sakit: meetings.filter(x => x.status === 'sakit').length,
          'Persentase Kehadiran': meetings.length ? `${Math.round((hadir / meetings.length) * 100)}%` : '0%',
        })
      })
    }
  }

  return rows
}


async function buildMemberExportRows(orgs: Org[], kelas: string, nama: string) {
  const rows: Record<string, unknown>[] = []
  const uniqueOrgs = Array.from(new Set(orgs))

  for (const org of uniqueOrgs) {
    if (org === 'programming' || org === 'english') {
      const data = await prisma.siswa.findMany({ where: { ekskul: org, ...memberWhere(kelas, nama) }, orderBy: { nama: 'asc' } })
      data.forEach((s) => rows.push({
        NAMA: s.nama,
        KELAS: s.kelas || '-',
        NIS: s.nis || '-',
        GMAIL: s.email || '-',
      }))
    } else {
      const data = org === 'osis'
        ? await prisma.anggotaOsis.findMany({ where: memberWhere(kelas, nama), orderBy: { nama: 'asc' } })
        : await prisma.anggotaMpk.findMany({ where: memberWhere(kelas, nama), orderBy: { nama: 'asc' } })
      data.forEach((a) => rows.push({
        NAMA: a.nama,
        KELAS: a.kelas || '-',
        NIS: a.nis || '-',
        GMAIL: a.email || '-',
      }))
    }
  }

  return rows
}


export async function GET(req: NextRequest) {
  const ctx = getCtx(req)
  const { searchParams } = new URL(req.url)
  const rawType = (searchParams.get('tipe') || 'absensi') as ExportType
  const tipe: ExportType = rawType === 'absensi_ekskul' || rawType === 'absensi_organisasi' ? 'absensi'
    : rawType === 'rekap_siswa' ? 'kehadiran'
    : rawType
  const org = searchParams.get('org') || ''
  const kelas = searchParams.get('kelas') || ''
  const nama = searchParams.get('nama') || ''
  const startDate = searchParams.get('start') || ''
  const endDate = searchParams.get('end') || ''
  const accessible = getAccessibleOrgs(ctx.userRole) as Org[]

  if (tipe === 'admin') {
    if (ctx.userRole !== 'administrator') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    const wb = XLSX.utils.book_new()
    const data = await prisma.user.findMany({ orderBy: { nama: 'asc' } })
    appendJsonSheet(wb, data.map((u) => ({
      Nama: u.nama,
      Email: u.email,
      Role: ROLE_LABELS[u.role] || u.role,
      Password: u.password,
    })), 'Daftar Admin', [30, 30, 25, 45])
    const output = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
    return new NextResponse(output, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="export_admin_${new Date().toISOString().split('T')[0]}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    })
  }

  const range = parseDateRange(startDate, endDate)
  if (!range) {
    return NextResponse.json({ error: 'Filter tanggal mulai dan akhir wajib diisi dengan benar' }, { status: 400 })
  }

  const selectedOrgs = Array.from(new Set(org ? [org as Org] : accessible))
  if (selectedOrgs.length === 0 || selectedOrgs.some(o => !accessible.includes(o))) {
    return NextResponse.json({ error: 'Akses export untuk ekskul ini ditolak' }, { status: 403 })
  }

  if (!['absensi', 'kas', 'kehadiran', 'absensi_kehadiran', 'semua', 'siswa'].includes(tipe)) {
    return NextResponse.json({ error: 'Jenis export tidak valid' }, { status: 400 })
  }

  const wb = XLSX.utils.book_new()
  const addAbsensi = tipe === 'absensi' || tipe === 'absensi_kehadiran' || tipe === 'semua'
  const addKas = tipe === 'kas' || tipe === 'semua'
  const addKehadiran = tipe === 'kehadiran' || tipe === 'absensi_kehadiran' || tipe === 'semua'
  const addSiswa = tipe === 'siswa'

  if (addAbsensi) {
    appendJsonSheet(wb, await buildAbsensiRows(selectedOrgs, range, kelas, nama), 'Absensi', [5, 16, 18, 30, 14, 16, 24, 22, 18])
  }
  if (addKas) {
    appendJsonSheet(wb, await buildKasRows(selectedOrgs, range, kelas, nama), 'Kas', [5, 16, 18, 30, 14, 14, 16, 34, 22])
  }
  if (addKehadiran) {
    appendJsonSheet(wb, await buildKehadiranRows(selectedOrgs, range, kelas, nama), 'Kehadiran', [5, 18, 30, 14, 18, 16, 10, 14, 10, 10, 18])
  }
  if (addSiswa) {
    // Export member list with custom headers: NAMA, KELAS, NIS, GMAIL
    const memberExportRows = await buildMemberExportRows(selectedOrgs, kelas, nama);
    appendJsonSheet(wb, memberExportRows, 'Anggota', [20, 10, 20, 30]);
  }

  await createLog({
    userId: ctx.userId,
    userNama: ctx.userNama,
    aksi: 'CREATE',
    tabel: 'export',
    deskripsi: `${ctx.userNama} export ${EXPORT_LABELS[tipe] || tipe} untuk ${selectedOrgs.map(o => ORG_LABELS[o]).join(', ')} periode ${startDate} s/d ${endDate}${kelas ? `, kelas ${kelas}` : ''}${nama ? `, nama "${nama}"` : ''}`,
    dataBaru: { tipe, orgs: selectedOrgs, startDate, endDate, kelas, nama },
    ipAddress: getIp(req),
  })

  const output = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  const filename = `export_${tipe}_${selectedOrgs.join('-')}_${new Date().toISOString().split('T')[0]}.xlsx`

  return new NextResponse(output, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
