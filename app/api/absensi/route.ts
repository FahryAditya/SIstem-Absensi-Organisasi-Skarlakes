import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { getAccessibleOrgs } from '@/lib/auth-shared'
import { getAccessibleOrganizations } from '@/lib/services/organization-service'
import { pusherServer } from '@/lib/pusher-server'
import { updateExp } from '@/lib/exp'
import { z } from 'zod'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

export async function GET(req: NextRequest) {
  const { userId, userRole } = getCtx(req)
  const { searchParams } = new URL(req.url)
  const tanggal = searchParams.get('tanggal')
  const ekskul = searchParams.get('ekskul')
  const mode = searchParams.get('mode')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '100')

  // Build accessible ekskul filter
  const accessibleOrgs = await getAccessibleOrganizations(userId, userRole)
  const accessibleSlugs = accessibleOrgs.map(o => o.slug)

  if (mode === 'orgs') {
    return NextResponse.json({ orgs: accessibleOrgs })
  }

  let ekskulFilter = accessibleSlugs
  if (ekskul && accessibleSlugs.includes(ekskul)) ekskulFilter = [ekskul]

  const isDynamicOrg = (slug: string) => !['programming', 'english', 'osis', 'mpk'].includes(slug)

  // Optimized Input Mode: Combined Siswa + Absensi data
  if (mode === 'input' && tanggal && ekskul && accessibleSlugs.includes(ekskul)) {
    if (isDynamicOrg(ekskul)) {
      // Fetch from dynamic models
      const org = await prisma.organization.findUnique({ where: { slug: ekskul } })
      if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

      const [members, existingAttendance] = await Promise.all([
        prisma.member.findMany({
          where: { organization_id: org.id },
          select: { id: true, name: true, class: true },
          orderBy: { name: 'asc' }
        }),
        prisma.attendanceV2.findMany({
          where: {
            organization_id: org.id,
            date: new Date(tanggal)
          },
          select: { member_id: true, attendance_status: true, cash_amount: true, notes: true }
        })
      ])

      const absMap = Object.fromEntries(
        existingAttendance.map(a => [a.member_id, a])
      )

      const rows = members.map(m => ({
        siswa_id: m.id,
        nama: m.name,
        kelas: m.class,
        ekskul: ekskul,
        status: absMap[m.id]?.attendance_status || 'hadir',
        uang_kas: absMap[m.id]?.cash_amount || 0,
        keterangan: absMap[m.id]?.notes || '',
      }))

      return NextResponse.json({ data: rows, orgs: accessibleOrgs })
    } else {
      // Original logic for programming/english
      const [siswaList, existingAbsensi] = await Promise.all([
        prisma.siswa.findMany({
          where: { ekskul: ekskul as any },
          select: { id: true, nama: true, kelas: true, ekskul: true },
          orderBy: { nama: 'asc' }
        }),
        prisma.absensi.findMany({
          where: {
            tanggal: new Date(tanggal),
            siswa: { ekskul: ekskul as any }
          },
          select: { siswa_id: true, status: true, uang_kas: true, keterangan: true }
        })
      ])

      const absMap = Object.fromEntries(
        existingAbsensi.map((a: { siswa_id: number; status: string; uang_kas: number; keterangan: string | null }) => [
          a.siswa_id,
          a
        ])
      )
      const rows = siswaList.map((s: { id: number; nama: string; kelas: string | null; ekskul: string }) => ({
        siswa_id: s.id,
        nama: s.nama,
        kelas: s.kelas,
        ekskul: s.ekskul,
        status: absMap[s.id]?.status || 'hadir',
        uang_kas: absMap[s.id]?.uang_kas || 0,
        keterangan: absMap[s.id]?.keterangan || '',
      }))

      return NextResponse.json({ data: rows, orgs: accessibleOrgs })
    }
  }

  // Riwayat mode
  let data: any[] = []
  let total = 0

  // This part is tricky because we might want to see riwayat from both systems.
  // But usually, we filter by ekskul.
  
  if (ekskul && isDynamicOrg(ekskul)) {
    const org = await prisma.organization.findUnique({ where: { slug: ekskul } })
    if (org) {
      const where: any = {
        organization_id: org.id,
        ...(tanggal ? { date: new Date(tanggal) } : {})
      }
      const [att, count] = await Promise.all([
        prisma.attendanceV2.findMany({
          where,
          include: { member: true },
          orderBy: { date: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.attendanceV2.count({ where })
      ])
      
      data = att.map(a => ({
        id: a.id,
        siswa: { id: a.member_id, nama: a.member.name, kelas: a.member.class, ekskul: ekskul },
        tanggal: a.date,
        status: a.attendance_status,
        uang_kas: a.cash_amount,
        keterangan: a.notes,
        creator: { nama: 'System' } // AttendanceV2 doesn't have creator yet
      }))
      total = count
    }
  } else {
    // Old system logic
    const where: Record<string, unknown> = {
      siswa: { ekskul: { in: ekskulFilter.filter(s => !isDynamicOrg(s)) } },
      ...(tanggal ? { 
        tanggal: new Date(tanggal)
      } : {}),
    }

    const [oldData, oldCount] = await Promise.all([
      prisma.absensi.findMany({
        where,
        include: { siswa: true, creator: { select: { id: true, nama: true } } },
        orderBy: [{ tanggal: 'desc' }, { siswa: { nama: 'asc' } }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.absensi.count({ where }),
    ])
    data = oldData
    total = oldCount
  }

  return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit), orgs: accessibleOrgs })
}

// Bulk upsert absensi
const bulkSchema = z.object({
  tanggal: z.string(),
  rows: z.array(z.object({
    siswa_id: z.number(),
    status: z.enum(['hadir', 'tidak_hadir', 'izin', 'sakit']),
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
  
  const { searchParams } = new URL(req.url)
  const ekskul = searchParams.get('ekskul')
  
  if (!ekskul) return NextResponse.json({ error: 'Ekskul is required' }, { status: 400 })

  const accessibleOrgs = await getAccessibleOrganizations(ctx.userId, ctx.userRole)
  const accessibleSlugs = accessibleOrgs.map(o => o.slug)
  
  if (!accessibleSlugs.includes(ekskul)) {
    return NextResponse.json({ error: `Akses ditolak untuk ekskul ${ekskul}` }, { status: 403 })
  }

  const isDynamicOrg = (slug: string) => !['programming', 'english', 'osis', 'mpk'].includes(slug)

  if (isDynamicOrg(ekskul)) {
    const org = await prisma.organization.findUnique({ where: { slug: ekskul } })
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    const memberIds = rows.map(r => r.siswa_id)
    const members = await prisma.member.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, name: true }
    })

    const existingAttendance = await prisma.attendanceV2.findMany({
      where: {
        organization_id: org.id,
        date: tanggalDate,
        member_id: { in: memberIds }
      },
      select: { member_id: true, attendance_status: true }
    })
    const existingMap = Object.fromEntries(
      existingAttendance.map(a => [a.member_id, a.attendance_status])
    )

    const results = await prisma.$transaction(async (tx) => {
      const saved = []
      for (const row of rows) {
        const prevStatus = existingMap[row.siswa_id]
        const xpDiff = hitungSelisihExpAbsensi(prevStatus, row.status)

        const upserted = await tx.attendanceV2.upsert({
          where: { member_id_date: { member_id: row.siswa_id, date: tanggalDate } },
          update: { attendance_status: row.status, cash_amount: row.uang_kas, notes: row.keterangan },
          create: { 
            organization_id: org.id, 
            member_id: row.siswa_id, 
            date: tanggalDate, 
            attendance_status: row.status, 
            cash_amount: row.uang_kas, 
            notes: row.keterangan 
          },
        })

        if (xpDiff !== 0) {
          await updateExp({
            tipeAnggota: 'member',
            targetId: row.siswa_id,
            selisih: xpDiff,
            alasan: xpDiff > 0 ? 'Hadir kegiatan' : 'Tidak hadir kegiatan',
            adminId: ctx.userId,
            organisasi: ekskul,
            tx,
          })
        }

        saved.push(upserted)
      }
      return saved
    })

    // Log
    const memberMap = Object.fromEntries(members.map(m => [m.id, m.name]))
    const summary = rows.map(r => `${memberMap[r.siswa_id] || r.siswa_id}: ${r.status}`).join(', ')
    await createLog({
      userId: ctx.userId, userNama: ctx.userNama, aksi: 'UPDATE',
      tabel: 'attendance_v2', deskripsi: `${ctx.userNama} menyimpan absensi ${org.nama} tanggal ${tanggal} (${rows.length} anggota): ${summary}`,
      dataBaru: { tanggal, jumlah: rows.length, organizationId: org.id },
      ipAddress: getIp(req),
    })

    if (pusherServer) {
      try {
        await pusherServer.trigger('absensi', 'absensi-updated', {
          tanggal,
          count: results.length,
          userNama: ctx.userNama,
          organizationSlug: ekskul
        })
      } catch (err) {
        console.error('Failed to trigger Pusher absensi-updated:', err)
      }
    }

    return NextResponse.json({ success: true, count: results.length })
  }

  // Verify access for each siswa (Old system)
  const siswaIds = rows.map(r => r.siswa_id)
  const siswaList = await prisma.siswa.findMany({
    where: { id: { in: siswaIds } },
    select: { id: true, nama: true, ekskul: true }
  })

  for (const s of siswaList) {
    if (!accessibleSlugs.includes(s.ekskul))
      return NextResponse.json({ error: `Akses ditolak untuk ekskul ${s.ekskul}` }, { status: 403 })
  }

  // Fetch existing absensi to calculate XP differences
  const existingAbsensi = await prisma.absensi.findMany({
    where: {
      tanggal: tanggalDate,
      siswa_id: { in: siswaIds }
    },
    select: { siswa_id: true, status: true }
  })
  const existingMap = Object.fromEntries(
    existingAbsensi.map((a: { siswa_id: number; status: string }) => [a.siswa_id, a.status])
  )

  // Upsert absensi dan perubahan EXP dalam satu transaction.
  const results = await prisma.$transaction(async (tx) => {
    const saved = []

    for (const row of rows) {
      const prevStatus = existingMap[row.siswa_id]
      const xpDiff = hitungSelisihExpAbsensi(prevStatus, row.status)

      const upserted = await tx.absensi.upsert({
        where: { siswa_id_tanggal: { siswa_id: row.siswa_id, tanggal: tanggalDate } },
        update: { status: row.status, uang_kas: row.uang_kas, keterangan: row.keterangan, updated_by: ctx.userId },
        create: { siswa_id: row.siswa_id, tanggal: tanggalDate, status: row.status, uang_kas: row.uang_kas, keterangan: row.keterangan, created_by: ctx.userId },
      })

      // Update EXP via updateExp() (wajib lewat fungsi ini)
      if (xpDiff !== 0) {
        const siswa = siswaList.find((s: { id: number; ekskul: string }) => s.id === row.siswa_id)
        await updateExp({
          tipeAnggota: 'siswa',
          targetId: row.siswa_id,
          selisih: xpDiff,
          alasan: xpDiff > 0 ? 'Hadir ekskul' : 'Tidak hadir ekskul',
          adminId: ctx.userId,
          organisasi: siswa?.ekskul ?? 'programming',
          tx,
        })
      }

      // Streak bonus EXP (cek setelah hadir)
      if (row.status === 'hadir') {
        const riwayat = await tx.absensi.findMany({
          where: { siswa_id: row.siswa_id, status: 'hadir' },
          orderBy: { tanggal: 'desc' },
          take: 10,
        })
        const streak = riwayat.length
        const siswa = siswaList.find((s: { id: number; ekskul: string }) => s.id === row.siswa_id)
        if (streak === 3) {
          await updateExp({ tipeAnggota: 'siswa', targetId: row.siswa_id, selisih: 15, alasan: 'Streak hadir 3x berturut-turut', adminId: ctx.userId, organisasi: siswa?.ekskul ?? 'programming', tx })
        } else if (streak === 5) {
          await updateExp({ tipeAnggota: 'siswa', targetId: row.siswa_id, selisih: 30, alasan: 'Streak hadir 5x berturut-turut', adminId: ctx.userId, organisasi: siswa?.ekskul ?? 'programming', tx })
        }
      }

      saved.push(upserted)
    }

    return saved
  })

  // Log
  const siswaMap = Object.fromEntries(
    siswaList.map((s: { id: number; nama: string }) => [s.id, s.nama])
  )
  const summary = rows.map(r => `${siswaMap[r.siswa_id] || r.siswa_id}: ${r.status}`).join(', ')
  await createLog({
    userId: ctx.userId, userNama: ctx.userNama, aksi: 'UPDATE',
    tabel: 'absensi', deskripsi: `${ctx.userNama} menyimpan absensi tanggal ${tanggal} (${rows.length} siswa): ${summary}`,
    dataBaru: { tanggal, jumlah: rows.length },
    ipAddress: getIp(req),
  })

  if (pusherServer) {
    try {
      await pusherServer.trigger('absensi', 'absensi-updated', {
        tanggal,
        count: results.length,
        userNama: ctx.userNama,
      })
    } catch (err) {
      console.error('Failed to trigger Pusher absensi-updated:', err)
    }
  }

  return NextResponse.json({ success: true, count: results.length })
}

export async function PUT(req: NextRequest) {
  const ctx = getCtx(req)
  const body = await req.json()
  const { id, ...data } = body
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const existing = await prisma.absensi.findUnique({
    where: { id },
    include: { siswa: true }
  })
  if (!existing) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })

  const accessible = getAccessibleOrgs(ctx.userRole)
  if (!accessible.includes(existing.siswa.ekskul))
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const xpDiff = data.status
    ? hitungSelisihExpAbsensi(existing.status, data.status)
    : 0

  const updated = await prisma.$transaction(async (tx) => {
    const updatedAbsensi = await tx.absensi.update({
      where: { id },
      data: { ...data, updated_by: ctx.userId },
      include: { siswa: true }
    })

    if (xpDiff !== 0) {
      await updateExp({
        tipeAnggota: 'siswa',
        targetId: existing.siswa_id,
        selisih: xpDiff,
        alasan: xpDiff > 0 ? 'Hadir ekskul (koreksi)' : 'Tidak hadir ekskul (koreksi)',
        adminId: ctx.userId,
        organisasi: existing.siswa.ekskul,
        tx,
      })
    }

    return updatedAbsensi
  })

  await createLog({
    userId: ctx.userId, userNama: ctx.userNama, aksi: 'UPDATE',
    tabel: 'absensi', recordId: id,
    deskripsi: `${ctx.userNama} mengubah absensi "${existing.siswa.nama}" tanggal ${existing.tanggal.toISOString().split('T')[0]}`,
    dataLama: { status: existing.status, uang_kas: existing.uang_kas },
    dataBaru: { status: updated.status, uang_kas: updated.uang_kas },
    ipAddress: getIp(req),
  })

  if (pusherServer) {
    try {
      await pusherServer.trigger('absensi', 'absensi-updated', {
        tanggal: existing.tanggal.toISOString().split('T')[0],
        count: 1,
        siswaNama: existing.siswa.nama,
        status: updated.status,
        userNama: ctx.userNama,
      })
    } catch (err) {
      console.error('Failed to trigger Pusher absensi-updated:', err)
    }
  }

  return NextResponse.json({ data: updated })
}

function hitungSelisihExpAbsensi(statusLama: string | undefined, statusBaru: string) {
  const nilaiStatus = (status: string | undefined) => {
    if (status === 'hadir') return 10
    if (status === 'tidak_hadir') return -10
    return 0
  }

  return nilaiStatus(statusBaru) - nilaiStatus(statusLama)
}
