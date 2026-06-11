import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseExcelFile } from '@/lib/services/excel.service'
import { createLog, getIp } from '@/lib/log'
import { getAccessibleOrgs } from '@/lib/auth-shared'

export const dynamic = 'force-dynamic'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: (req.headers.get('x-user-role') || '').trim(),
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = getCtx(req)
    if (!ctx.userId || !ctx.userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accessible = getAccessibleOrgs(ctx.userRole)
    if (accessible.length === 0) {
      return NextResponse.json({ error: 'Forbidden: Anda tidak memiliki akses admin' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const organizationType = formData.get('organizationType') as string | null // 'programming' | 'english' | 'osis' | 'mpk'

    if (!file || !organizationType) {
      return NextResponse.json({ error: 'File Excel dan tipe organisasi wajib disertakan' }, { status: 400 })
    }

    const orgTypeLower = organizationType.toLowerCase() as 'programming' | 'english' | 'osis' | 'mpk'
    if (!accessible.includes(orgTypeLower)) {
      return NextResponse.json({ error: 'Akses ditolak: Anda tidak mengelola organisasi ini' }, { status: 403 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { data, errors: validationErrors } = parseExcelFile(buffer)

    if (data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Tidak ada data valid di dalam Excel.',
        errors: validationErrors,
      }, { status: 400 })
    }

    let successRows = 0
    const importErrors: { row: string; error: string }[] = []

    // Process row-by-row
    for (const row of data) {
      try {
        const namaTrimmed = row.nama.trim()
        const nisTrimmed = row.nis ? row.nis.trim() : null

        if (orgTypeLower === 'programming' || orgTypeLower === 'english') {
          // Check duplicate name inside ekskul
          const duplikatNama = await prisma.siswa.findFirst({
            where: {
              ekskul: orgTypeLower,
              nama: { equals: namaTrimmed, mode: 'insensitive' },
            },
          })
          if (duplikatNama) {
            throw new Error(`Siswa dengan nama "${namaTrimmed}" sudah terdaftar di ekskul ${orgTypeLower}`)
          }

          // Check duplicate NIS inside ekskul
          if (nisTrimmed) {
            const duplikatNis = await prisma.siswa.findFirst({
              where: {
                ekskul: orgTypeLower,
                nis: nisTrimmed,
              },
            })
            if (duplikatNis) {
              throw new Error(`NIS "${nisTrimmed}" sudah terdaftar di ekskul ${orgTypeLower}`)
            }
          }

          // Create Siswa
          await prisma.siswa.create({
            data: {
              nama: namaTrimmed,
              kelas: row.kelas.trim(),
              nis: nisTrimmed,
              jabatan: row.jabatan.trim(),
              email: row.email,
              ekskul: orgTypeLower,
              created_by: ctx.userId,
            },
          })
        } else if (orgTypeLower === 'osis') {
          // Check duplicate name in OSIS
          const duplikatNama = await prisma.anggotaOsis.findFirst({
            where: {
              nama: { equals: namaTrimmed, mode: 'insensitive' },
            },
          })
          if (duplikatNama) {
            throw new Error(`Anggota OSIS dengan nama "${namaTrimmed}" sudah terdaftar`)
          }

          // Check duplicate NIS in OSIS
          if (nisTrimmed) {
            const duplikatNis = await prisma.anggotaOsis.findFirst({
              where: { nis: nisTrimmed },
            })
            if (duplikatNis) {
              throw new Error(`NIS "${nisTrimmed}" sudah digunakan oleh anggota OSIS lain`)
            }
          }

          // Create AnggotaOsis
          await prisma.anggotaOsis.create({
            data: {
              nama: namaTrimmed,
              kelas: row.kelas.trim(),
              nis: nisTrimmed,
              jabatan: row.jabatan.trim(),
              email: row.email,
            },
          })
        } else if (orgTypeLower === 'mpk') {
          // Check duplicate name in MPK
          const duplikatNama = await prisma.anggotaMpk.findFirst({
            where: {
              nama: { equals: namaTrimmed, mode: 'insensitive' },
            },
          })
          if (duplikatNama) {
            throw new Error(`Anggota MPK dengan nama "${namaTrimmed}" sudah terdaftar`)
          }

          // Check duplicate NIS in MPK
          if (nisTrimmed) {
            const duplikatNis = await prisma.anggotaMpk.findFirst({
              where: { nis: nisTrimmed },
            })
            if (duplikatNis) {
              throw new Error(`NIS "${nisTrimmed}" sudah digunakan oleh anggota MPK lain`)
            }
          }

          // Create AnggotaMpk
          await prisma.anggotaMpk.create({
            data: {
              nama: namaTrimmed,
              kelas: row.kelas.trim(),
              nis: nisTrimmed,
              jabatan: row.jabatan.trim(),
              email: row.email,
            },
          })
        }

        successRows++
      } catch (err: any) {
        importErrors.push({
          row: row.nama,
          error: err.message || 'Gagal menyimpan ke database',
        })
      }
    }

    const failureRows = data.length - successRows

    // Create import log record
    await prisma.emailImportLog.create({
      data: {
        filename: file.name,
        totalRows: data.length,
        successRows,
        failureRows,
        organizationType: orgTypeLower as any,
        admin_id: ctx.userId,
        errors: JSON.stringify(importErrors),
        status: failureRows === 0 ? 'completed' : failureRows === data.length ? 'failed' : 'partial',
      },
    })

    // Log this activity to activity log
    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'CREATE',
      tabel: 'email_import_logs',
      recordId: '0',
      deskripsi: `${ctx.userNama} melakukan impor Excel untuk organisasi ${orgTypeLower.toUpperCase()}. Sukses: ${successRows}, Gagal: ${failureRows}`,
      ipAddress: getIp(req),
    })

    return NextResponse.json({
      success: true,
      imported: successRows,
      failed: failureRows,
      errors: [...validationErrors.map(e => ({ row: `Baris ${e.row}`, error: `${e.field}: ${e.error}` })), ...importErrors],
    })
  } catch (error: any) {
    console.error('Import excel API error:', error)
    return NextResponse.json({ error: 'Gagal memproses impor file Excel: ' + error.message }, { status: 500 })
  }
}
