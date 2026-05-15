import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ORG_LABELS } from '@/lib/utils'
import { createLog, getIp } from '@/lib/log'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { z } from 'zod'
import { isAdministrator } from '@/lib/auth-shared'

type Org = 'programming' | 'english' | 'osis' | 'mpk'
type ClearType = 'absensi' | 'kas' | 'anggota' | 'semua'

const clearSchema = z.object({
  org: z.enum(['programming', 'english', 'osis', 'mpk']),
  tipe: z.enum(['absensi', 'kas', 'anggota', 'semua']),
  konfirmasi: z.string().min(1),
})

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

function escapeSqlValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value instanceof Date) {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `'${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())} ${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}:${pad(value.getUTCSeconds())}'`
  }
  const raw = typeof value === 'object' ? JSON.stringify(value) : String(value)
  return `'${raw.replace(/\\/g, '\\\\').replace(/'/g, "''").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`
}

function insertSql(tableName: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return `-- Tabel ${tableName}: kosong\n\n`
  const columns = Object.keys(rows[0])
  const columnSql = columns.map(c => `\`${c}\``).join(', ')
  const valueSql = rows.map(row => `  (${columns.map(c => escapeSqlValue(row[c])).join(', ')})`).join(',\n')
  return `INSERT INTO \`${tableName}\` (${columnSql}) VALUES\n${valueSql};\n\n`
}

function asRows(rows: unknown[]) {
  return rows.map(row => ({ ...(row as Record<string, unknown>) }))
}

async function getScopedData(org: Org) {
  if (org === 'programming' || org === 'english') {
    const siswa = await prisma.siswa.findMany({ where: { ekskul: org } })
    const siswaIds = siswa.map(s => s.id)
    const absensi = await prisma.absensi.findMany({ where: { siswa_id: { in: siswaIds } } })
    const pengeluaranKas = await prisma.pengeluaranKas.findMany({ where: { organisasi_type: org } })
    return { siswa, anggotaOsis: [], anggotaMpk: [], absensi, absensiOrganisasi: [], pengeluaranKas }
  }

  if (org === 'osis') {
    const anggotaOsis = await prisma.anggotaOsis.findMany()
    const absensiOrganisasi = await prisma.absensiOrganisasi.findMany({ where: { organisasi_type: org } })
    const pengeluaranKas = await prisma.pengeluaranKas.findMany({ where: { organisasi_type: org } })
    return { siswa: [], anggotaOsis, anggotaMpk: [], absensi: [], absensiOrganisasi, pengeluaranKas }
  }

  const anggotaMpk = await prisma.anggotaMpk.findMany()
  const absensiOrganisasi = await prisma.absensiOrganisasi.findMany({ where: { organisasi_type: org } })
  const pengeluaranKas = await prisma.pengeluaranKas.findMany({ where: { organisasi_type: org } })
  return { siswa: [], anggotaOsis: [], anggotaMpk, absensi: [], absensiOrganisasi, pengeluaranKas }
}

async function createScopedBackup(org: Org, tipe: ClearType) {
  const data = await getScopedData(org)
  const now = new Date()
  const stamp = now.toISOString().replace(/[:.]/g, '-')
  let sql = `-- Backup sebelum clear database\n-- Ekskul: ${ORG_LABELS[org]}\n-- Tipe clear: ${tipe}\n-- Dibuat: ${now.toISOString()}\n\n`
  sql += '-- Tabel: siswa\n' + insertSql('siswa', asRows(data.siswa))
  sql += '-- Tabel: anggota_osis\n' + insertSql('anggota_osis', asRows(data.anggotaOsis))
  sql += '-- Tabel: anggota_mpk\n' + insertSql('anggota_mpk', asRows(data.anggotaMpk))
  sql += '-- Tabel: absensi\n' + insertSql('absensi', asRows(data.absensi))
  sql += '-- Tabel: absensi_organisasi\n' + insertSql('absensi_organisasi', asRows(data.absensiOrganisasi))
  sql += '-- Tabel: pengeluaran_kas\n' + insertSql('pengeluaran_kas', asRows(data.pengeluaranKas))

  const backupDir = path.join(process.cwd(), 'backups')
  await mkdir(backupDir, { recursive: true })
  const filename = `backup-clear-${org}-${tipe}-${stamp}.sql`
  const filePath = path.join(backupDir, filename)
  await writeFile(filePath, sql, 'utf8')
  return { filename, filePath }
}

async function clearAbsensi(org: Org) {
  if (org === 'programming' || org === 'english') {
    const siswa = await prisma.siswa.findMany({ where: { ekskul: org }, select: { id: true } })
    return prisma.absensi.deleteMany({ where: { siswa_id: { in: siswa.map(s => s.id) } } })
  }
  return prisma.absensiOrganisasi.deleteMany({ where: { organisasi_type: org } })
}

async function clearKas(org: Org) {
  if (org === 'programming' || org === 'english') {
    const siswa = await prisma.siswa.findMany({ where: { ekskul: org }, select: { id: true } })
    const [kasAbsensi, pengeluaran] = await prisma.$transaction([
      prisma.absensi.updateMany({ where: { siswa_id: { in: siswa.map(s => s.id) } }, data: { uang_kas: 0 } }),
      prisma.pengeluaranKas.deleteMany({ where: { organisasi_type: org } }),
    ])
    return { count: kasAbsensi.count + pengeluaran.count }
  }
  const [kasAbsensi, pengeluaran] = await prisma.$transaction([
    prisma.absensiOrganisasi.updateMany({ where: { organisasi_type: org }, data: { uang_kas: 0 } }),
    prisma.pengeluaranKas.deleteMany({ where: { organisasi_type: org } }),
  ])
  return { count: kasAbsensi.count + pengeluaran.count }
}

async function clearAnggota(org: Org) {
  if (org === 'programming' || org === 'english') {
    return prisma.siswa.deleteMany({ where: { ekskul: org } })
  }
  if (org === 'osis') return prisma.anggotaOsis.deleteMany()
  return prisma.anggotaMpk.deleteMany()
}

export async function POST(req: NextRequest) {
  const ctx = getCtx(req)
  if (!isAdministrator(ctx.userRole.trim())) {
    return NextResponse.json({ error: 'Hanya Super Admin yang dapat clear database' }, { status: 403 })
  }

  const parsed = clearSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { org, tipe, konfirmasi } = parsed.data
  if (konfirmasi !== `HAPUS ${org.toUpperCase()}`) {
    return NextResponse.json({ error: `Ketik HAPUS ${org.toUpperCase()} untuk konfirmasi` }, { status: 400 })
  }

  const backup = await createScopedBackup(org, tipe)
  const result: Record<string, number> = {}

  if (tipe === 'absensi') {
    result.absensi = (await clearAbsensi(org)).count
  } else if (tipe === 'kas') {
    result.kas = (await clearKas(org)).count
  } else if (tipe === 'anggota') {
    result.anggota = (await clearAnggota(org)).count
  } else {
    result.absensi = (await clearAbsensi(org)).count
    result.kas = (await clearKas(org)).count
    result.anggota = (await clearAnggota(org)).count
  }

  await createLog({
    userId: ctx.userId,
    userNama: ctx.userNama,
    aksi: 'DELETE',
    tabel: 'clear_database',
    deskripsi: `${ctx.userNama} clear database ${tipe} untuk ${ORG_LABELS[org]}. Backup: ${backup.filename}`,
    dataLama: { org, tipe, backup: backup.filename },
    dataBaru: result,
    ipAddress: getIp(req),
  })

  return NextResponse.json({ success: true, backup: backup.filename, result })
}
