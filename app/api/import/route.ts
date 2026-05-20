import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { getAccessibleOrgs } from '@/lib/auth-shared'
import { pusherServer } from '@/lib/pusher-server'
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
    let skippedCount = 0

    if (org === 'programming' || org === 'english') {
      // ── Pre-filter: buang nama yang sudah ada (case-insensitive) ──────────
      const incomingNames = data.map(d => d.nama.trim()).filter(Boolean)

      const existingByName = await prisma.siswa.findMany({
        where: {
          ekskul: org,
          nama: { in: incomingNames, mode: 'insensitive' },
        },
        select: { nama: true, nis: true },
      })
      const existingNameSet = new Set(existingByName.map((e: any) => e.nama.toLowerCase()))

      // Pre-filter berdasarkan NIS jika tersedia
      const incomingNisList = data.map(d => d.nis?.trim()).filter((n): n is string => !!n && n !== '')
      let existingNisSet = new Set<string>()
      if (incomingNisList.length > 0) {
        const existingByNis = await prisma.siswa.findMany({
          where: { ekskul: org, nis: { in: incomingNisList } },
          select: { nis: true },
        })
        existingNisSet = new Set(existingByNis.map((e: any) => (e.nis || '').toLowerCase()))
      }

      const uniqueData = data.filter(item => {
        const namaLower = item.nama.trim().toLowerCase()
        const nisLower = (item.nis || '').trim().toLowerCase()
        if (existingNameSet.has(namaLower)) return false
        if (nisLower && existingNisSet.has(nisLower)) return false
        return true
      })

      skippedCount = data.length - uniqueData.length

      if (uniqueData.length > 0) {
        const createData = uniqueData.map(item => ({
          nama: item.nama.trim(),
          kelas: item.kelas || '',
          nis: item.nis || '',
          ekskul: org,
          created_by: ctx.userId,
        }))

        // skipDuplicates sebagai safety net untuk race condition saat createMany
        const result = await prisma.siswa.createMany({
          data: createData,
          skipDuplicates: true,
        })
        insertedCount = result.count
      }

    } else if (org === 'osis') {
      const filteredData = data.filter(item => {
        const k = item.kelas ? String(item.kelas).trim().toUpperCase() : ''
        return !k.startsWith('[MPK]')
      })

      const incomingNames = filteredData.map(d => d.nama.trim()).filter(Boolean)

      // Pre-filter nama yang sudah ada
      const existingByName = await prisma.anggotaOsis.findMany({
        where: { nama: { in: incomingNames, mode: 'insensitive' } },
        select: { nama: true, nis: true },
      })
      const existingNameSet = new Set(existingByName.map((e: any) => e.nama.toLowerCase()))

      const incomingNisList = filteredData.map(d => d.nis?.trim()).filter((n): n is string => !!n && n !== '')
      let existingNisSet = new Set<string>()
      if (incomingNisList.length > 0) {
        const existingByNis = await prisma.anggotaOsis.findMany({
          where: { nis: { in: incomingNisList } },
          select: { nis: true },
        })
        existingNisSet = new Set(existingByNis.map((e: any) => (e.nis || '').toLowerCase()))
      }

      const uniqueData = filteredData.filter(item => {
        const namaLower = item.nama.trim().toLowerCase()
        const nisLower = (item.nis || '').trim().toLowerCase()
        if (existingNameSet.has(namaLower)) return false
        if (nisLower && existingNisSet.has(nisLower)) return false
        return true
      })

      skippedCount = data.length - uniqueData.length

      if (uniqueData.length > 0) {
        const createData = uniqueData.map(item => {
          const rawKelas = item.kelas ? String(item.kelas).trim() : ''
          const cleanKelas = rawKelas.replace(/^\[(OSIS|MPK)\]\s*/i, '')
          return {
            nama: item.nama.trim(),
            kelas: cleanKelas,
            nis: item.nis || '',
            jabatan: item.jabatan || 'Anggota',
          }
        })
        const result = await prisma.anggotaOsis.createMany({ data: createData, skipDuplicates: true })
        insertedCount = result.count
      }

    } else if (org === 'mpk') {
      const filteredData = data.filter(item => {
        const k = item.kelas ? String(item.kelas).trim().toUpperCase() : ''
        return !k.startsWith('[OSIS]')
      })

      const incomingNames = filteredData.map(d => d.nama.trim()).filter(Boolean)

      const existingByName = await prisma.anggotaMpk.findMany({
        where: { nama: { in: incomingNames, mode: 'insensitive' } },
        select: { nama: true, nis: true },
      })
      const existingNameSet = new Set(existingByName.map((e: any) => e.nama.toLowerCase()))

      const incomingNisList = filteredData.map(d => d.nis?.trim()).filter((n): n is string => !!n && n !== '')
      let existingNisSet = new Set<string>()
      if (incomingNisList.length > 0) {
        const existingByNis = await prisma.anggotaMpk.findMany({
          where: { nis: { in: incomingNisList } },
          select: { nis: true },
        })
        existingNisSet = new Set(existingByNis.map((e: any) => (e.nis || '').toLowerCase()))
      }

      const uniqueData = filteredData.filter(item => {
        const namaLower = item.nama.trim().toLowerCase()
        const nisLower = (item.nis || '').trim().toLowerCase()
        if (existingNameSet.has(namaLower)) return false
        if (nisLower && existingNisSet.has(nisLower)) return false
        return true
      })

      skippedCount = data.length - uniqueData.length

      if (uniqueData.length > 0) {
        const createData = uniqueData.map(item => {
          const rawKelas = item.kelas ? String(item.kelas).trim() : ''
          const cleanKelas = rawKelas.replace(/^\[(OSIS|MPK)\]\s*/i, '')
          return {
            nama: item.nama.trim(),
            kelas: cleanKelas,
            nis: item.nis || '',
            jabatan: item.jabatan || 'Anggota',
          }
        })
        const result = await prisma.anggotaMpk.createMany({ data: createData, skipDuplicates: true })
        insertedCount = result.count
      }
    }

    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'CREATE',
      tabel: org === 'osis' || org === 'mpk' ? `anggota_${org}` : 'siswa',
      recordId: 0,
      deskripsi: `${ctx.userNama} berhasil import ${insertedCount} data ke ${org.toUpperCase()}${skippedCount > 0 ? ` (${skippedCount} duplikat dilewati)` : ''}`,
      ipAddress: getIp(req),
    })

    if (pusherServer && insertedCount > 0) {
      try {
        await pusherServer.trigger('absensi', 'absensi-updated', {
          org,
          count: insertedCount,
          userNama: ctx.userNama,
        })
      } catch (err) {
        console.error('Failed to trigger Pusher absensi-updated from import:', err)
      }
    }

    return NextResponse.json({
      success: true,
      count: insertedCount,
      skipped: skippedCount,
      ...(skippedCount > 0 && {
        message: `${insertedCount} data berhasil ditambahkan. ${skippedCount} data dilewati karena sudah ada.`,
      }),
    })
  } catch (e: any) {
    console.error('[IMPORT ERROR]', e)
    return NextResponse.json({ error: 'Terjadi kesalahan server saat import' }, { status: 500 })
  }
}
