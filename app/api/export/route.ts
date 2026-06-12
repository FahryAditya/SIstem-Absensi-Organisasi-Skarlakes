import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import * as XLSX from 'xlsx'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
    activeOrgId: req.headers.get('x-active-org-id') ? parseInt(req.headers.get('x-active-org-id')!) : undefined
  }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = getCtx(req)
    const activeOrgId = ctx.activeOrgId

    if (!activeOrgId) {
      return NextResponse.json({ error: 'No active organization selected' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'members'

    const org = await prisma.organization.findUnique({ where: { id: activeOrgId } })
    if (!org) return NextResponse.json({ error: 'Organisasi tidak ditemukan' }, { status: 404 })

    let data: any[] = []
    let filename = `export-${org.slug}-${type}.xlsx`

    if (type === 'members') {
      const members = await prisma.member.findMany({
        where: { organization_id: activeOrgId },
        orderBy: { name: 'asc' }
      })
      data = members.map(m => ({
        Nama: m.name,
        Kelas: m.class,
        NIS: m.nis,
        Email: m.email,
        Jabatan: m.jabatan,
        Level: m.level,
        XP: m.exp,
        Status: m.status,
        'Terdaftar Pada': m.created_at
      }))
    } else if (type === 'attendance') {
      const attendance = await prisma.attendance.findMany({
        where: { organization_id: activeOrgId },
        include: { member: true },
        orderBy: { date: 'desc' }
      })
      data = attendance.map(a => ({
        Tanggal: a.date,
        Nama: a.member.name,
        Kelas: a.member.class,
        Status: a.status,
        'Uang Kas': a.cash_amount,
        Keterangan: a.notes
      }))
    } else if (type === 'cash') {
      const transactions = await prisma.cashTransaction.findMany({
        where: { organization_id: activeOrgId },
        include: { member: true },
        orderBy: { created_at: 'desc' }
      })
      data = transactions.map(t => ({
        Tanggal: t.created_at,
        Nama: t.member?.name || '-',
        Tipe: t.type,
        Nominal: t.amount,
        Deskripsi: t.description
      }))
    }

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data")
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'CREATE',
      organizationId: activeOrgId,
      tabel: 'export',
      recordId: 0,
      deskripsi: `Export data ${type} untuk ${org.nama}`,
      ipAddress: getIp(req),
    })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error: any) {
    console.error('[EXPORT ERROR]', error)
    return NextResponse.json({ error: 'Gagal mengekspor data' }, { status: 500 })
  }
}
