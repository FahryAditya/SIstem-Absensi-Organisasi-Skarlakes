import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { z } from 'zod'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
    activeOrgId: req.headers.get('x-active-org-id') ? parseInt(req.headers.get('x-active-org-id')!) : undefined
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = getCtx(req)
    const activeOrgId = ctx.activeOrgId

    if (!activeOrgId) {
      return NextResponse.json({ error: 'No active organization selected' }, { status: 400 })
    }

    const contentType = req.headers.get('content-type') || ''
    if (!contentType.startsWith('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type harus multipart/form-data' }, { status: 400 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
    }
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      return NextResponse.json({ error: 'Format file harus .xlsx, .xls, atau .csv' }, { status: 400 })
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

    // Normalisasi kolom
    const normalizeRow = (row: any) => {
      const normalized: Record<string, any> = {}
      for (const key of Object.keys(row)) {
        const lower = key.trim().toLowerCase()
        if (lower.includes('nama')) normalized.name = row[key]
        else if (lower.includes('kelas')) normalized.class = row[key]
        else if (lower.includes('nis') || lower.includes('nisn')) normalized.nis = row[key]
        else if (lower.includes('jabatan')) normalized.jabatan = row[key]
        else if (lower.includes('email')) normalized.email = row[key]
      }
      return normalized
    }

    const rows = jsonData
      .map(normalizeRow)
      .filter((row: any) => row.name && String(row.name).trim().length > 0)

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data yang valid (kolom Nama kosong)' }, { status: 400 })
    }

    const createData = rows.map((item: any) => ({
      name: String(item.name).trim(),
      class: item.class ? String(item.class).trim() : '',
      nis: item.nis ? String(item.nis).trim() : '',
      email: item.email ? String(item.email).trim() : null,
      jabatan: item.jabatan ? String(item.jabatan).trim() : 'Anggota',
      organization_id: activeOrgId,
    }))

    const result = await prisma.member.createMany({
      data: createData,
      skipDuplicates: true,
    })

    const org = await prisma.organization.findUnique({ where: { id: activeOrgId } })

    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'CREATE',
      organizationId: activeOrgId,
      tabel: 'members',
      recordId: 0,
      deskripsi: `Import Excel ${rows.length} baris → ${result.count} data baru ke ${org?.nama || 'organisasi'}`,
      ipAddress: getIp(req),
    })

    return NextResponse.json({
      success: true,
      count: result.count,
      totalRows: rows.length,
      message: `${result.count} dari ${rows.length} data berhasil diimport`,
    })
  } catch (e: any) {
    console.error('[IMPORT EXCEL ERROR]', e)
    return NextResponse.json({ error: e.message || 'Terjadi kesalahan server saat import' }, { status: 500 })
  }
}
