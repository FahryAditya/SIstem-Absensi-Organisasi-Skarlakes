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
      for (const group of groups) {
        // Fetch details for each student in the group
        const groupMembers: any[] = []
        
        for (const s of group.siswa) {
          let memberData: any = null
          if (s.org === 'osis') {
            memberData = await prisma.anggotaOsis.findUnique({ where: { id: s.id } })
          } else if (s.org === 'mpk') {
            memberData = await prisma.anggotaMpk.findUnique({ where: { id: s.id } })
          } else {
            memberData = await prisma.siswa.findUnique({ where: { id: s.id } })
          }

          if (memberData) {
            groupMembers.push({
              nama: memberData.nama,
              kelas: memberData.kelas || '-',
              org: s.org.toUpperCase(),
            })
          }
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
            (m.org === 'OSIS' ? '🔵 ' : m.org === 'MPK' ? '🔴 ' : '⚫ ') + m.org
          ])
        })
        
        // Add spacing between groups
        sheetData.push([])
        sheetData.push([])
      }
    } else if (siswaSelections) {
      // Original behavior for non-grouped
      let members: any[] = []
      
      for (const s of siswaSelections) {
        let memberData: any = null
        if (s.org === 'osis') {
          memberData = await prisma.anggotaOsis.findUnique({ where: { id: s.id } })
        } else if (s.org === 'mpk') {
          memberData = await prisma.anggotaMpk.findUnique({ where: { id: s.id } })
        } else {
          memberData = await prisma.siswa.findUnique({ where: { id: s.id } })
        }

        if (memberData) {
          members.push({
            nama: memberData.nama,
            kelas: memberData.kelas || '-',
            org: s.org.toUpperCase(),
          })
        }
      }

      members.sort((a, b) => a.nama.localeCompare(b.nama))

      sheetData.push(['DAFTAR HADIR KEGIATAN: ' + judulKegiatan.toUpperCase()])
      sheetData.push(['No', 'Nama', 'Kelas', 'Organisasi'])
      
      members.forEach((m, idx) => {
        sheetData.push([
          idx + 1,
          m.nama,
          m.kelas,
          (m.org === 'OSIS' ? '🔵 ' : m.org === 'MPK' ? '🔴 ' : '⚫ ') + m.org
        ])
      })
    }

    const ws = XLSX.utils.aoa_to_sheet(sheetData)
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
