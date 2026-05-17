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

const itemSchema = z.object({
  nama: z.string().min(1),
  kelas: z.string().optional().nullable(),
  nis: z.string().optional().nullable(),
  jabatan: z.string().optional().nullable(), // Khusus OSIS/MPK
})

const schema = z.object({
  org: z.enum(['programming', 'english', 'osis', 'mpk']),
  data: z.array(itemSchema).min(1, 'Data tidak boleh kosong'),
})

export async function POST(req: NextRequest) {
  try {
    const ctx = getCtx(req)
    const body = await req.json()
    const parsed = schema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Format data tidak valid' }, { status: 400 })
    }

    const { org, data } = parsed.data
    const accessible = getAccessibleOrgs(ctx.userRole)

    if (!accessible.includes(org)) {
      return NextResponse.json({ error: 'Akses ditolak untuk unit ini' }, { status: 403 })
    }

    let insertedCount = 0

    if (org === 'programming' || org === 'english') {
      const createData = data.map(item => ({
        nama: item.nama,
        kelas: item.kelas || '',
        nis: item.nis || '',
        ekskul: org,
        created_by: ctx.userId
      }))
      
      const result = await prisma.siswa.createMany({
        data: createData,
        skipDuplicates: true
      })
      insertedCount = result.count
      
    } else if (org === 'osis') {
      const filteredData = data.filter(item => {
        const k = item.kelas ? String(item.kelas).trim().toUpperCase() : ''
        return !k.startsWith('[MPK]')
      })
      const createData = filteredData.map(item => {
        const rawKelas = item.kelas ? String(item.kelas).trim() : ''
        const cleanKelas = rawKelas.replace(/^\[(OSIS|MPK)\]\s*/i, '')
        return {
          nama: item.nama,
          kelas: cleanKelas,
          nis: item.nis || '',
          jabatan: item.jabatan || 'Anggota',
        }
      })
      const result = await prisma.anggotaOsis.createMany({ data: createData, skipDuplicates: true })
      insertedCount = result.count
      
    } else if (org === 'mpk') {
      const filteredData = data.filter(item => {
        const k = item.kelas ? String(item.kelas).trim().toUpperCase() : ''
        return !k.startsWith('[OSIS]')
      })
      const createData = filteredData.map(item => {
        const rawKelas = item.kelas ? String(item.kelas).trim() : ''
        const cleanKelas = rawKelas.replace(/^\[(OSIS|MPK)\]\s*/i, '')
        return {
          nama: item.nama,
          kelas: cleanKelas,
          nis: item.nis || '',
          jabatan: item.jabatan || 'Anggota',
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
      deskripsi: `${ctx.userNama} berhasil meng-import/menambahkan ${insertedCount} data ke ${org.toUpperCase()}`,
      ipAddress: getIp(req),
    })

    return NextResponse.json({ success: true, count: insertedCount })
  } catch (e: any) {
    console.error('[IMPORT ERROR]', e)
    return NextResponse.json({ error: 'Terjadi kesalahan server saat import' }, { status: 500 })
  }
}
