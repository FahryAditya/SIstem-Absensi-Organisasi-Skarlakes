import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessibleOrgs } from '@/lib/auth-shared'
import { createLog, getIp } from '@/lib/log'
import * as XLSX from 'xlsx'
import { z } from 'zod'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

const reqSchema = z.object({
  orgs: z.array(z.enum(['osis', 'mpk', 'programming', 'english'])).min(1, 'Pilih minimal satu organisasi'),
  judulKegiatan: z.string().min(1, 'Judul kegiatan wajib diisi'),
  siswaSelections: z.array(
    z.object({
      org: z.enum(['osis', 'mpk', 'programming', 'english']),
      id: z.number(),
    })
  ).min(1, 'Pilih minimal satu siswa/anggota'),
})

export async function POST(req: NextRequest) {
  try {
    const ctx = getCtx(req)
    const body = await req.json()
    const parsed = reqSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { orgs, judulKegiatan, siswaSelections } = parsed.data

    // Authorization check
    const accessible = getAccessibleOrgs(ctx.userRole)
    const allAuthorized = orgs.every((org) => accessible.includes(org))
    if (!allAuthorized) {
      return NextResponse.json({ error: 'Akses ditolak untuk satu atau lebih unit/organisasi terpilih' }, { status: 403 })
    }

    // Fetch student data based on organization selections
    let members: Array<{ nis: string | null; nama: string; kelas: string | null; extra: string }> = []

    interface MemberWithJabatan {
      nis: string | null
      nama: string
      kelas: string | null
      jabatan: string | null
    }

    interface BasicMember {
      nis: string | null
      nama: string
      kelas: string | null
    }

    const osisIds = siswaSelections.filter((s) => s.org === 'osis').map((s) => s.id)
    const mpkIds = siswaSelections.filter((s) => s.org === 'mpk').map((s) => s.id)
    const programmingIds = siswaSelections.filter((s) => s.org === 'programming').map((s) => s.id)
    const englishIds = siswaSelections.filter((s) => s.org === 'english').map((s) => s.id)

    if (osisIds.length > 0) {
      const data = await prisma.anggotaOsis.findMany({
        where: { id: { in: osisIds } },
        orderBy: { nama: 'asc' },
      })
      members.push(
        ...(data as unknown as MemberWithJabatan[]).map((m) => ({
          nis: m.nis,
          nama: m.nama,
          kelas: m.kelas,
          extra: `OSIS - ${m.jabatan || 'Anggota'}`,
        }))
      )
    }

    if (mpkIds.length > 0) {
      const data = await prisma.anggotaMpk.findMany({
        where: { id: { in: mpkIds } },
        orderBy: { nama: 'asc' },
      })
      members.push(
        ...(data as unknown as MemberWithJabatan[]).map((m) => ({
          nis: m.nis,
          nama: m.nama,
          kelas: m.kelas,
          extra: `MPK - ${m.jabatan || 'Anggota'}`,
        }))
      )
    }

    if (programmingIds.length > 0) {
      const data = await prisma.siswa.findMany({
        where: { id: { in: programmingIds }, ekskul: 'programming' },
        orderBy: { nama: 'asc' },
      })
      members.push(
        ...(data as unknown as BasicMember[]).map((m) => ({
          nis: m.nis,
          nama: m.nama,
          kelas: m.kelas,
          extra: 'Programming',
        }))
      )
    }

    if (englishIds.length > 0) {
      const data = await prisma.siswa.findMany({
        where: { id: { in: englishIds }, ekskul: 'english' },
        orderBy: { nama: 'asc' },
      })
      members.push(
        ...(data as unknown as BasicMember[]).map((m) => ({
          nis: m.nis,
          nama: m.nama,
          kelas: m.kelas,
          extra: 'English Club',
        }))
      )
    }

    // Sort all combined members alphabetically by name
    members.sort((a, b) => a.nama.localeCompare(b.nama))

    if (members.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data siswa terpilih yang ditemukan' }, { status: 400 })
    }

    // Build Excel using xlsx
    const wb = XLSX.utils.book_new()
    const orgLabelText = orgs.map((o) => o.toUpperCase()).join(', ')

    // Create custom AOA (Array of Arrays) for premium print styling
    const sheetData: any[][] = [
      ['YAYASAN AIRLANGGA BALIKPAPAN'],
      ['SMK KESEHATAN AIRLANGGA'],
      ['DAFTAR HADIR KEGIATAN KESISWAAN / EKSTRAKURIKULER'],
      [],
      ['Kegiatan', `: ${judulKegiatan}`],
      ['Unit / Organisasi', `: ${orgLabelText}`],
      ['Tanggal Cetak', `: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`],
      [],
      [
        'NO',
        'NIS',
        'NAMA LENGKAP',
        'KELAS',
        'JABATAN / EKSKUL',
        'TANDA TANGAN (GANJIL)',
        'TANDA TANGAN (GENAP)',
        'KETERANGAN',
      ],
    ]

    // Fill members with alternating signature spots
    members.forEach((m, idx) => {
      const no = idx + 1
      const ttdGanjil = no % 2 !== 0 ? `${no}. ............................` : ''
      const ttdGenap = no % 2 === 0 ? `${no}. ............................` : ''

      sheetData.push([
        no,
        m.nis || '-',
        m.nama,
        m.kelas || '-',
        m.extra,
        ttdGanjil,
        ttdGenap,
        '', // empty for remarks
      ])
    })

    // Add empty space for signatures of organizers/ pembina
    sheetData.push([])
    sheetData.push([])
    sheetData.push(['', '', '', '', '', '', 'Balikpapan, ' + new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })])
    sheetData.push(['', '', '', '', '', '', 'Mengetahui,'])
    sheetData.push(['', '', '', '', '', '', 'Pembina / Penanggung Jawab'])
    sheetData.push([])
    sheetData.push([])
    sheetData.push([])
    sheetData.push(['', '', '', '', '', '', '( ___________________________ )'])

    const ws = XLSX.utils.aoa_to_sheet(sheetData)

    // Set custom column widths for beautiful alignment
    ws['!cols'] = [
      { wch: 6 },  // NO
      { wch: 15 }, // NIS
      { wch: 30 }, // NAMA LENGKAP
      { wch: 15 }, // KELAS
      { wch: 22 }, // JABATAN / EKSKUL
      { wch: 25 }, // TANDA TANGAN (GANJIL)
      { wch: 25 }, // TANDA TANGAN (GENAP)
      { wch: 20 }, // KETERANGAN
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Hadir')

    // Create audit log
    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'CREATE',
      tabel: 'export',
      deskripsi: `${ctx.userNama} mengunduh Daftar Ambil Siswa untuk kegiatan "${judulKegiatan}" (${orgLabelText}) berisi ${members.length} anggota`,
      dataBaru: { orgs, judulKegiatan, jumlahSiswa: members.length },
      ipAddress: getIp(req),
    })

    const output = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
    const filename = `ambil_siswa_gabungan_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(output, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    console.error('[AMBIL SISWA ERROR]', error)
    return NextResponse.json({ error: 'Terjadi kesalahan internal server: ' + error.message }, { status: 500 })
  }
}
