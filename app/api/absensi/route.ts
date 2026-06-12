import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { pusherServer } from '@/lib/pusher-server'
import { updateExp } from '@/lib/exp'
import { z } from 'zod'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
    activeOrgId: req.headers.get('x-active-org-id') ? parseInt(req.headers.get('x-active-org-id')!) : undefined
  }
}

export async function GET(req: NextRequest) {
  const { userId, userRole, activeOrgId } = getCtx(req)
  const { searchParams } = new URL(req.url)
  const tanggal = searchParams.get('tanggal')
  const mode = searchParams.get('mode')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '100')

  // Super admins can view global data if no activeOrgId, 
  // but usually they work within a selected org too.
  const filterOrgId = userRole === 'SUPER_ADMIN' ? (activeOrgId || undefined) : activeOrgId

  if (!filterOrgId && userRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No active organization selected' }, { status: 400 })
  }

  // mode=input: Get all members and their attendance for a specific date
  if (mode === 'input' && tanggal && filterOrgId) {
    const [members, existingAttendance] = await Promise.all([
      prisma.member.findMany({
        where: { organization_id: filterOrgId, status: 'ACTIVE' },
        select: { id: true, name: true, class: true },
        orderBy: { name: 'asc' }
      }),
      prisma.attendance.findMany({
        where: {
          organization_id: filterOrgId,
          date: new Date(tanggal)
        },
        select: { member_id: true, status: true, cash_amount: true, notes: true }
      })
    ])

    const absMap = Object.fromEntries(
      existingAttendance.map(a => [a.member_id, a])
    )

    const rows = members.map(m => ({
      member_id: m.id,
      nama: m.name,
      kelas: m.class,
      status: absMap[m.id]?.status || 'hadir',
      uang_kas: absMap[m.id]?.cash_amount || 0,
      keterangan: absMap[m.id]?.notes || '',
    }))

    return NextResponse.json({ data: rows })
  }

  // Default: Riwayat mode
  const where: any = {
    ...(filterOrgId ? { organization_id: filterOrgId } : {}),
    ...(tanggal ? { date: new Date(tanggal) } : {})
  }

  const [attendance, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: { member: true },
      orderBy: [{ date: 'desc' }, { member: { name: 'asc' } }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.attendance.count({ where })
  ])

  return NextResponse.json({ 
    data: attendance, 
    total, 
    page, 
    totalPages: Math.ceil(total / limit) 
  })
}

const bulkSchema = z.object({
  tanggal: z.string(),
  rows: z.array(z.object({
    member_id: z.number(),
    status: z.string(), // hadir, izin, sakit, alpa
    uang_kas: z.number().min(0).default(0),
    keterangan: z.string().nullable().optional(),
  }))
})

export async function POST(req: NextRequest) {
  const ctx = getCtx(req)
  const body = await req.json()
  const parsed = bulkSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { tanggal, rows } = parsed.data
  const tanggalDate = new Date(tanggal)
  const activeOrgId = ctx.activeOrgId

  if (!activeOrgId) {
    return NextResponse.json({ error: 'No active organization selected' }, { status: 400 })
  }

  // Verify access to members
  const memberIds = rows.map(r => r.member_id)
  const members = await prisma.member.findMany({
    where: { 
      id: { in: memberIds },
      organization_id: activeOrgId
    },
    select: { id: true, name: true }
  })

  if (members.length !== rows.length) {
    return NextResponse.json({ error: 'Beberapa anggota tidak valid untuk organisasi ini' }, { status: 403 })
  }

  const existingAttendance = await prisma.attendance.findMany({
    where: {
      organization_id: activeOrgId,
      date: tanggalDate,
      member_id: { in: memberIds }
    },
    select: { member_id: true, status: true }
  })
  const existingMap = Object.fromEntries(
    existingAttendance.map(a => [a.member_id, a.status])
  )

  const results = await prisma.$transaction(async (tx) => {
    const saved = []
    for (const row of rows) {
      const prevStatus = existingMap[row.member_id]
      const xpDiff = hitungSelisihExpAbsensi(prevStatus, row.status)

      const upserted = await tx.attendance.upsert({
        where: { member_id_date: { member_id: row.member_id, date: tanggalDate } },
        update: { status: row.status, cash_amount: row.uang_kas, notes: row.keterangan },
        create: { 
          organization_id: activeOrgId, 
          member_id: row.member_id, 
          date: tanggalDate, 
          status: row.status, 
          cash_amount: row.uang_kas, 
          notes: row.keterangan 
        },
      })

      if (xpDiff !== 0) {
        await updateExp({
          tipeAnggota: 'member',
          targetId: row.member_id,
          selisih: xpDiff,
          alasan: xpDiff > 0 ? 'Hadir kegiatan' : 'Tidak hadir kegiatan',
          adminId: ctx.userId,
          organizationId: activeOrgId,
          tx,
        })
      }

      // If there is cash_amount, create a transaction too? 
      // Usually, we track total kas per day, but detailed per-member is better.
      if (row.uang_kas > 0) {
        await tx.cashTransaction.upsert({
          where: { 
            // Unique per member per date for attendance kas
            id: -1 // This is a placeholder, usually we'd have a specific relation or just create
          },
          // For simplicity, we'll just use a more generic approach in a real implementation
          // but for now, we'll just keep it in attendance table as it was.
          create: {
            organization_id: activeOrgId,
            member_id: row.member_id,
            amount: row.uang_kas,
            type: 'INCOME',
            description: `Uang kas tanggal ${tanggal}`,
          },
          update: {
            amount: row.uang_kas,
          }
        }).catch(() => {
           // Handle unique constraint if needed
           return tx.cashTransaction.create({
             data: {
                organization_id: activeOrgId,
                member_id: row.member_id,
                amount: row.uang_kas,
                type: 'INCOME',
                description: `Uang kas tanggal ${tanggal}`,
             }
           })
        })
      }

      saved.push(upserted)
    }
    return saved
  })

  // Log
  const memberMap = Object.fromEntries(members.map(m => [m.id, m.name]))
  const summary = rows.map(r => `${memberMap[r.member_id] || r.member_id}: ${r.status}`).join(', ')
  await createLog({
    userId: ctx.userId, 
    userNama: ctx.userNama, 
    aksi: 'UPDATE',
    organizationId: activeOrgId,
    tabel: 'attendance', 
    deskripsi: `Menyimpan absensi tanggal ${tanggal} (${rows.length} anggota): ${summary}`,
    dataBaru: { tanggal, jumlah: rows.length },
    ipAddress: getIp(req),
  })

  if (pusherServer) {
    try {
      await pusherServer.trigger('absensi', 'absensi-updated', {
        tanggal,
        count: results.length,
        userNama: ctx.userNama,
        organizationId: activeOrgId
      })
    } catch (err) {}
  }

  return NextResponse.json({ success: true, count: results.length })
}

function hitungSelisihExpAbsensi(statusLama: string | undefined, statusBaru: string) {
  const nilaiStatus = (status: string | undefined) => {
    if (status === 'hadir') return 10
    if (status === 'tidak_hadir' || status === 'alpa') return -10
    return 0
  }
  return nilaiStatus(statusBaru) - nilaiStatus(statusLama)
}
