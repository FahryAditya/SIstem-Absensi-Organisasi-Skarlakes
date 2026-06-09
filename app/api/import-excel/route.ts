import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { getAccessibleOrgs } from '@/lib/auth-shared'
import { z } from 'zod'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

const schema = z.object({
  org: z.enum(['programming', 'english', 'osis', 'mpk']),
})

export async function POST(req: NextRequest) {
  try {
    const ctx = getCtx(req)

    const contentType = req.headers.get('content-type') || ''
    if (!contentType.startsWith('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type harus multipart/form-data' }, { status: 400 })
    }

    const formData = await req.formData()
    const org = formData.get('org') as string
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
    }
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      return NextResponse.json({ error: 'Format file harus .xlsx, .xls, atau .csv' }, { status: 400 })
    }

    // Validasi org
    const parsed = schema.safeParse({ org })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Organisasi tidak valid' }, { status: 400 })
    }

    const accessible = getAccessibleOrgs(ctx.userRole)
    if (!accessible.includes(org)) {
      return NextResponse.json({ error: 'Akses ditolak untuk unit ini' }, { status: 403 })
    }

    // Parse Excel
    const XLSX_MODULE = await import('xlsx')
    const XLSX = XLSX_MODULE.default || XLSX_MODULE
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const firstSheet = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheet]
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet)

    if (!jsonData || jsonData.length === 0) {
      return NextResponse.json({ error: 'File kosong atau tidak bisa dibaca' }, { status: 400 })
    }

    // Normalisasi kolom (handle case-insensitive header)
    const normalizeRow = (row: any) => {
      const normalized: Record<string, any> = {}
      for (const key of Object.keys(row)) {
        const lower = key.trim().toLowerCase()
        if (lower.includes('nama')) normalized.nama = row[key]
        else if (lower.includes('kelas')) normalized.kelas = row[key]
        else if (lower.includes('nis') || lower.includes('nisn')) normalized.nis = row[key]
        else if (lower.includes('jabatan')) normalized.jabatan = row[key]
      }
      return normalized
    }

    const rows = jsonData
      .map(normalizeRow)
      .filter((row: any) => row.nama && String(row.nama).trim().length > 0)

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data yang valid (kolom Nama kosong)' }, { status: 400 })
    }

    let insertedCount = 0

    if (org === 'programming' || org === 'english') {
      const createData = rows.map((item: any) => ({
        nama: String(item.nama).trim(),
        kelas: item.kelas ? String(item.kelas).trim() : '',
        nis: item.nis ? String(item.nis).trim() : '',
        ekskul: org as any,
        created_by: ctx.userId,
      }))

      const result = await prisma.siswa.createMany({
        data: createData,
        skipDuplicates: true,
      })
      insertedCount = result.count
    } else if (org === 'osis') {
      const createData = rows.map((item: any) => {
        const rawKelas = item.kelas ? String(item.kelas).trim() : ''
        const cleanKelas = rawKelas.replace(/^\[(OSIS|MPK)\]\s*/i, '')
        return {
          nama: String(item.nama).trim(),
          kelas: cleanKelas,
          nis: item.nis ? String(item.nis).trim() : '',
          jabatan: item.jabatan ? String(item.jabatan).trim() : 'Anggota',
        }
      })
      const result = await prisma.anggotaOsis.createMany({ data: createData, skipDuplicates: true })
      insertedCount = result.count
    } else if (org === 'mpk') {
      const createData = rows.map((item: any) => {
        const rawKelas = item.kelas ? String(item.kelas).trim() : ''
        const cleanKelas = rawKelas.replace(/^\[(OSIS|MPK)\]\s*/i, '')
        return {
          nama: String(item.nama).trim(),
          kelas: cleanKelas,
          nis: item.nis ? String(item.nis).trim() : '',
          jabatan: item.jabatan ? String(item.jabatan).trim() : 'Anggota',
        }
      })
      const result = await prisma.anggotaMpk.createMany({ data: createData, skipDuplicates: true })
      insertedCount = result.count
    }

    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'CREATE',
      tabel: org === 'osis' || org === 'mpk' ? `anggota_${org}` : 'siswa',
      recordId: 0,
      deskripsi: `${ctx.userNama} import Excel ${rows.length} baris → ${insertedCount} data baru ke ${org.toUpperCase()}`,
      ipAddress: getIp(req),
    })

    return NextResponse.json({
      success: true,
      count: insertedCount,
      totalRows: rows.length,
      message: `${insertedCount} dari ${rows.length} data berhasil diimport`,
    })
  } catch (e: any) {
    console.error('[IMPORT EXCEL ERROR]', e)
    return NextResponse.json({ error: e.message || 'Terjadi kesalahan server saat import' }, { status: 500 })
  }
}