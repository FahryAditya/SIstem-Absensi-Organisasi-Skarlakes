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
  ).optional(),
  groups: z.array(
    z.object({
      name: z.string(),
      siswa: z.array(
        z.object({
          org: z.enum(['osis', 'mpk', 'programming', 'english']),
          id: z.number(),
        })
      ),
    })
  ).optional(),
  isGrouped: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const ctx = getCtx(req)
    const body = await req.json()
    const parsed = reqSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { orgs, judulKegiatan, siswaSelections, groups, isGrouped } = parsed.data

    // Authorization check
    const accessible = getAccessibleOrgs(ctx.userRole)
    const allAuthorized = orgs.every((org) => accessible.includes(org))
    if (!allAuthorized) {
      return NextResponse.json({ error: 'Akses ditolak untuk satu atau lebih unit/organisasi terpilih' }, { status: 403 })
    }

    const wb = XLSX.utils.book_new()
    const sheetData: any[][] = []

    if (isGrouped && groups) {
      // Gather all student IDs by organization across all groups to fetch them in batch
      const allSiswaIdsByOrg: Record<string, number[]> = { osis: [], mpk: [], programming: [], english: [] }
      groups.forEach(g => {
        g.siswa.forEach(s => {
          if (!allSiswaIdsByOrg[s.org].includes(s.id)) {
            allSiswaIdsByOrg[s.org].push(s.id)
          }
        })
      })

      // Batch fetch all required members
      const memberMap: Record<string, any> = {}
      
      if (allSiswaIdsByOrg.osis.length > 0) {
        const data = await prisma.anggotaOsis.findMany({ where: { id: { in: allSiswaIdsByOrg.osis } } })
        data.forEach(m => { memberMap[`osis-${m.id}`] = { nama: m.nama, kelas: m.kelas || '-', org: 'OSIS' } })
      }
      if (allSiswaIdsByOrg.mpk.length > 0) {
        const data = await prisma.anggotaMpk.findMany({ where: { id: { in: allSiswaIdsByOrg.mpk } } })
        data.forEach(m => { memberMap[`mpk-${m.id}`] = { nama: m.nama, kelas: m.kelas || '-', org: 'MPK' } })
      }
      if (allSiswaIdsByOrg.programming.length > 0) {
        const data = await prisma.siswa.findMany({ where: { id: { in: allSiswaIdsByOrg.programming } } })
        data.forEach(m => { memberMap[`programming-${m.id}`] = { nama: m.nama, kelas: m.kelas || '-', org: 'PROGRAMMING' } })
      }
      if (allSiswaIdsByOrg.english.length > 0) {
        const data = await prisma.siswa.findMany({ where: { id: { in: allSiswaIdsByOrg.english } } })
        data.forEach(m => { memberMap[`english-${m.id}`] = { nama: m.nama, kelas: m.kelas || '-', org: 'ENGLISH' } })
      }

      for (const group of groups) {
        const groupMembers: any[] = []
        for (const s of group.siswa) {
          const m = memberMap[`${s.org}-${s.id}`]
          if (m) groupMembers.push(m)
        }

        // Sort members alphabetically
        groupMembers.sort((a, b) => a.nama.localeCompare(b.nama))

        // Add Boxed Header for the group
        sheetData.push(['PANITIA: ' + group.name.toUpperCase()])
        sheetData.push(['No', 'Nama', 'Kelas', 'Organisasi'])
        
        groupMembers.forEach((m, idx) => {
          sheetData.push([
            idx + 1,
            m.nama,
            m.kelas,
            m.org
          ])
        })
        
        sheetData.push([])
        sheetData.push([])
      }
    } else if (siswaSelections) {
      // Original behavior for non-grouped, also optimized to batch
      const allSiswaIdsByOrg: Record<string, number[]> = { osis: [], mpk: [], programming: [], english: [] }
      siswaSelections.forEach(s => {
        if (!allSiswaIdsByOrg[s.org].includes(s.id)) {
          allSiswaIdsByOrg[s.org].push(s.id)
        }
      })

      const members: any[] = []
      if (allSiswaIdsByOrg.osis.length > 0) {
        const data = await prisma.anggotaOsis.findMany({ where: { id: { in: allSiswaIdsByOrg.osis } } })
        members.push(...data.map(m => ({ nama: m.nama, kelas: m.kelas || '-', org: 'OSIS' })))
      }
      if (allSiswaIdsByOrg.mpk.length > 0) {
        const data = await prisma.anggotaMpk.findMany({ where: { id: { in: allSiswaIdsByOrg.mpk } } })
        members.push(...data.map(m => ({ nama: m.nama, kelas: m.kelas || '-', org: 'MPK' })))
      }
      if (allSiswaIdsByOrg.programming.length > 0) {
        const data = await prisma.siswa.findMany({ where: { id: { in: allSiswaIdsByOrg.programming } } })
        members.push(...data.map(m => ({ nama: m.nama, kelas: m.kelas || '-', org: 'PROGRAMMING' })))
      }
      if (allSiswaIdsByOrg.english.length > 0) {
        const data = await prisma.siswa.findMany({ where: { id: { in: allSiswaIdsByOrg.english } } })
        members.push(...data.map(m => ({ nama: m.nama, kelas: m.kelas || '-', org: 'ENGLISH' })))
      }

      members.sort((a, b) => a.nama.localeCompare(b.nama))

      sheetData.push(['DAFTAR HADIR KEGIATAN: ' + judulKegiatan.toUpperCase()])
      sheetData.push(['No', 'Nama', 'Kelas', 'Organisasi'])
      
      members.forEach((m, idx) => {
        sheetData.push([
          idx + 1,
          m.nama,
          m.kelas,
          m.org
        ])
      })
    }

    const ws = XLSX.utils.aoa_to_sheet(sheetData)

    // Apply basic cell styling if possible with xlsx (limited in standard version)
    // We will set background colors for the Organisasi cells based on their content
    // Note: Standard 'xlsx' does not support cell styling (colors).
    // To support colors, we would need 'xlsx-js-style' or 'exceljs'.
    // However, I will implement the data changes first and use standard text.

    ws['!cols'] = [
      { wch: 6 },  // No
      { wch: 40 }, // Nama
      { wch: 15 }, // Kelas
      { wch: 20 }, // Organisasi
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Hadir')

    // Create audit log
    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'CREATE',
      tabel: 'export',
      deskripsi: `${ctx.userNama} mengunduh Daftar Ambil Siswa untuk kegiatan "${judulKegiatan}"`,
      dataBaru: { orgs, judulKegiatan },
      ipAddress: getIp(req),
    })

    const output = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
    const filename = `ambil_siswa_${new Date().toISOString().split('T')[0]}.xlsx`

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
