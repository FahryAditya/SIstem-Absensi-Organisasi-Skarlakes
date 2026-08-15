import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

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

export async function GET() {
  try {
    const reqHeaders = await headers()
    const userRole = reqHeaders.get('x-user-role')

    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

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

    let sqlDump = `-- Multi-Tenant Extracurricular System Backup\n`
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

    const dateStr = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
    return new NextResponse(sqlDump, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="full-backup-${dateStr}.sql"`
      }
    })
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json({ error: 'Failed to generate backup' }, { status: 500 })
  }
}
