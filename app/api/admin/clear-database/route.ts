import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { z } from 'zod'
import { getSessionFromRequest } from '@/lib/auth'
import { format } from 'date-fns'


export const dynamic = 'force-dynamic'

function isSuperAdmin(role: string) {
  return role === 'SUPER_ADMIN' || role === 'administrator'
}

// Enhanced schema accepting either number (ID) or string (slug) for orgId
const clearSchema = z.object({
  orgId: z.union([z.number(), z.string()]),
  tipe: z.enum(['absensi', 'kas', 'anggota', 'semua']),
  konfirmasi: z.string().min(1),
})

function escapeSqlValue(value: any): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value instanceof Date) {
    const pad = (n: number) => (n < 10 ? '0' + n : n)
    const y = value.getUTCFullYear()
    const m = pad(value.getUTCMonth() + 1)
    const d = pad(value.getUTCDate())
    const h = pad(value.getUTCHours())
    const min = pad(value.getUTCMinutes())
    const s = pad(value.getUTCSeconds())
    return `'${y}-${m}-${d} ${h}:${min}:${s}'`
  }
  if (typeof value === 'object') value = JSON.stringify(value)
  const escapedStr = String(value).replace(/\\/g, '\\\\').replace(/'/g, "''").replace(/\n/g, '\\n').replace(/\r/g, '\\r')
  return `'${escapedStr}'`
}

function generateInsertQuery(tableName: string, rows: any[]): string {
  if (!rows || rows.length === 0) return `-- Tabel ${tableName}: 0 rows\n\n`
  const columns = Object.keys(rows[0])
  const columnsStr = columns.map(c => `"${c}"`).join(', ')
  let sql = `INSERT INTO "${tableName}" (${columnsStr}) VALUES\n`
  const valuesStrs = rows.map(row => `  (${columns.map(c => escapeSqlValue(row[c])).join(', ')})`)
  sql += valuesStrs.join(',\n') + ';\n\n'
  return sql
}

// Utility function to build a SQL backup dump in memory before clearing.
// Returns the dump content so it can be streamed to the client for download —
// the serverless filesystem (/var/task) is read-only and /tmp is ephemeral,
// so nothing is written to disk here.
async function createBackupBeforeDelete(orgId: number, orgName: string): Promise<{ success: boolean; filename?: string; content?: string; error?: string }> {
  try {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
    const sanitizedOrgName = orgName.replace(/[^a-zA-Z0-9]/g, '_')
    const backupFilename = `backup_before_clear_${sanitizedOrgName}_${timestamp}.sql`
    
    // Query all database tables for fallback backup
    const [
      users,
      organizations,
      organization_admins,
      members,
      attendance,
      cash_transactions,
      cash_expenses,
      registrations,
      log_aktivitas,
      achievements,
      member_achievements
    ] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true, nama: true, email: true, role: true,
          created_at: true, updated_at: true, last_seen_update_id: true
        }
      }),
      prisma.organization.findMany(),
      prisma.organizationAdmin.findMany(),
      prisma.member.findMany(),
      prisma.attendance.findMany(),
      prisma.cashTransaction.findMany(),
      prisma.cashExpense.findMany(),
      prisma.registration.findMany(),
      prisma.logAktivitas.findMany(),
      prisma.achievement.findMany(),
      prisma.memberAchievement.findMany()
    ])

    let sqlDump = `-- Multi-Tenant Extracurricular System Backup (Auto before Clear)\n`
    sqlDump += `-- Dibuat pada: ${new Date().toISOString()}\n\n`

    sqlDump += generateInsertQuery('users', users)
    sqlDump += generateInsertQuery('organizations', organizations)
    sqlDump += generateInsertQuery('organization_admins', organization_admins)
    sqlDump += generateInsertQuery('members', members)
    sqlDump += generateInsertQuery('attendance', attendance)
    sqlDump += generateInsertQuery('cash_transactions', cash_transactions)
    sqlDump += generateInsertQuery('cash_expenses', cash_expenses)
    sqlDump += generateInsertQuery('registrations', registrations)
    sqlDump += generateInsertQuery('log_aktivitas', log_aktivitas)
    sqlDump += generateInsertQuery('achievements', achievements)
    sqlDump += generateInsertQuery('member_achievements', member_achievements)

    // No disk writes on serverless — hand the dump back to the caller for download.
    return { success: true, filename: backupFilename, content: sqlDump }
  } catch (error: any) {
    console.error('Backup creation failed:', error)
    return { success: false, error: error.message || 'Backup creation failed' }
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session || !isSuperAdmin(session.role as string)) {
      return NextResponse.json({ error: 'Dilarang' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = clearSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { orgId, tipe, konfirmasi } = parsed.data
    
    // Resolve organization by ID or Slug
    let org;
    if (typeof orgId === 'number') {
      org = await prisma.organization.findUnique({ where: { id: orgId } })
    } else {
      if (/^\d+$/.test(orgId)) {
        org = await prisma.organization.findUnique({ where: { id: parseInt(orgId) } })
      } else {
        org = await prisma.organization.findFirst({ where: { slug: orgId } })
      }
    }
    
    if (!org) return NextResponse.json({ error: 'Organisasi tidak ditemukan' }, { status: 404 })
    const resolvedOrgId = org.id

    // Consistent confirmation format - must match exactly slug or name
    const expectedConfirmationName = `HAPUS ${org.nama.toUpperCase()}`
    const expectedConfirmationSlug = `HAPUS ${org.slug.toUpperCase()}`
    
    if (konfirmasi.trim() !== expectedConfirmationName && konfirmasi.trim() !== expectedConfirmationSlug) {
      return NextResponse.json({ 
        error: `Ketik "${expectedConfirmationName}" atau "${expectedConfirmationSlug}" untuk konfirmasi` 
      }, { status: 400 })
    }

    // MANDATORY: Create backup before deletion
    const backupResult = await createBackupBeforeDelete(resolvedOrgId, org.nama)
    if (!backupResult.success) {
      return NextResponse.json({ 
        error: `Gagal membuat backup otomatis: ${backupResult.error}. Operasi dibatalkan untuk keamanan data.` 
      }, { status: 500 })
    }

    // Proceed with deletion after successful backup
    const result: Record<string, number> = {}

    if (tipe === 'absensi') {
      const res = await prisma.attendance.deleteMany({ where: { organization_id: resolvedOrgId } })
      result.absensi = res.count
    } else if (tipe === 'kas') {
      const [kasRes, expenseRes] = await prisma.$transaction([
        prisma.cashTransaction.deleteMany({ where: { organization_id: resolvedOrgId } }),
        prisma.cashExpense.deleteMany({ where: { organization_id: resolvedOrgId } }),
      ])
      result.kas = kasRes.count
      result.pengeluaran = expenseRes.count
      // Also reset cash_amount in attendance
      await prisma.attendance.updateMany({
        where: { organization_id: resolvedOrgId },
        data: { cash_amount: 0 }
      })
    } else if (tipe === 'anggota') {
      // Delete all related data for members
      const res = await prisma.$transaction(async (tx) => {
        await tx.attendance.deleteMany({ where: { organization_id: resolvedOrgId } })
        await tx.cashTransaction.deleteMany({ where: { organization_id: resolvedOrgId } })
        await tx.expLog.deleteMany({ where: { organization_id: resolvedOrgId } })
        const memberRes = await tx.member.deleteMany({ where: { organization_id: resolvedOrgId } })
        return memberRes
      })
      result.anggota = res.count
    } else {
      // 'semua' - comprehensive deletion
      const results = await prisma.$transaction(async (tx) => {
        const attRes = await tx.attendance.deleteMany({ where: { organization_id: resolvedOrgId } })
        const kasRes = await tx.cashTransaction.deleteMany({ where: { organization_id: resolvedOrgId } })
        const expRes = await tx.cashExpense.deleteMany({ where: { organization_id: resolvedOrgId } })
        const expLogRes = await tx.expLog.deleteMany({ where: { organization_id: resolvedOrgId } })
        const memRes = await tx.member.deleteMany({ where: { organization_id: resolvedOrgId } })
        const achRes = await tx.achievement.deleteMany({ where: { organization_id: resolvedOrgId } })
        
        return {
          attendance: attRes.count,
          kas: kasRes.count,
          pengeluaran: expRes.count,
          expLog: expLogRes.count,
          anggota: memRes.count,
          pencapaian: achRes.count
        }
      })
      Object.assign(result, results)
    }

    await createLog({
      userId: session.id,
      userNama: session.nama,
      aksi: 'DELETE',
      organizationId: resolvedOrgId,
      tabel: 'organizations',
      deskripsi: `${session.nama} membersihkan data [${tipe}] untuk organisasi ${org.nama}. Backup: ${backupResult.filename}`,
      dataBaru: { ...result, backupFile: backupResult.filename },
      ipAddress: getIp(req),
    })

    return NextResponse.json({
      success: true,
      result,
      backup: {
        filename: backupResult.filename,
        content: backupResult.content,
      },
      message: `Data berhasil dihapus. Unduh backup: ${backupResult.filename}`
    })
  } catch (err) {
    console.error('Clear database error:', err)
    return NextResponse.json({ 
      error: 'Terjadi kesalahan saat membersihkan database. Data tidak diubah untuk keamanan.' 
    }, { status: 500 })
  }
}
