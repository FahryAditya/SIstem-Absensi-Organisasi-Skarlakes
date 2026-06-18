import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { createLog, getIp } from '@/lib/log'
import * as XLSX from 'xlsx'
import { z } from 'zod'

function isSuperAdmin(role: string) {
  return role === 'SUPER_ADMIN' || role === 'administrator' || role === 'admin_osis_mpk'
}

const reqSchema = z.object({
  orgIds: z.array(z.number()).min(1, 'Pilih minimal satu organisasi'),
  judulKegiatan: z.string().min(1, 'Judul kegiatan wajib diisi'),
  siswaSelections: z.array(
    z.object({
      orgId: z.number(),
      id: z.number(),
    })
  ).optional(),
  groups: z.array(
    z.object({
      name: z.string(),
      siswa: z.array(
        z.object({
          orgId: z.number(),
          id: z.number(),
        })
      ),
    })
  ).optional(),
  isGrouped: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = reqSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { orgIds, judulKegiatan, siswaSelections, groups, isGrouped } = parsed.data

    // RBAC check
    if (!isSuperAdmin(session.role as string)) {
      const allAuthorized = orgIds.every((oid) => session.orgIds.includes(oid))
      if (!allAuthorized) {
        return NextResponse.json({ error: 'Akses ditolak untuk satu atau lebih organisasi terpilih' }, { status: 403 })
      }
    }

    const wb = XLSX.utils.book_new()
    const sheetData: any[][] = []

    if (isGrouped && groups) {
      const allSiswaIds = groups.flatMap(g => g.siswa.map(s => s.id))
      const members = await prisma.member.findMany({
        where: { id: { in: allSiswaIds } },
        include: { organization: { select: { nama: true } } }
      })
      const memberMap = Object.fromEntries(members.map(m => [m.id, m]))

      for (const group of groups) {
        const groupMembers = group.siswa
          .map(s => memberMap[s.id])
          .filter(Boolean)
          .sort((a, b) => a.name.localeCompare(b.name))

        sheetData.push(['PANITIA: ' + group.name.toUpperCase()])
        sheetData.push(['No', 'Nama', 'Kelas', 'Organisasi'])
        
        groupMembers.forEach((m, idx) => {
          sheetData.push([idx + 1, m.name, m.class || '-', m.organization.nama])
        })
        
        sheetData.push([])
        sheetData.push([])
      }
    } else if (siswaSelections) {
      const allSiswaIds = siswaSelections.map(s => s.id)
      const members = await prisma.member.findMany({
        where: { id: { in: allSiswaIds } },
        include: { organization: { select: { nama: true } } },
        orderBy: { name: 'asc' }
      })

      sheetData.push(['DAFTAR HADIR KEGIATAN: ' + judulKegiatan.toUpperCase()])
      sheetData.push(['No', 'Nama', 'Kelas', 'Organisasi'])
      
      members.forEach((m, idx) => {
        sheetData.push([idx + 1, m.name, m.class || '-', m.organization.nama])
      })
    }

    const ws = XLSX.utils.aoa_to_sheet(sheetData)
    ws['!cols'] = [{ wch: 6 }, { wch: 40 }, { wch: 15 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Hadir')

    await createLog({
      userId: session.id,
      userNama: session.nama,
      aksi: 'CREATE',
      tabel: 'export',
      deskripsi: `${session.nama} mengunduh Daftar Ambil Siswa untuk "${judulKegiatan}"`,
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
    return NextResponse.json({ error: 'Terjadi kesalahan internal server' }, { status: 500 })
  }
}
