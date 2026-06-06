import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessibleOrgs } from '@/lib/auth-shared'
import { createLog, getIp } from '@/lib/log'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = getCtx(req)
    const body = await req.json()
    const { id, type, action, reason } = body // action: 'accept' | 'reject'

    if (!id || !type || !action) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const accessibleOrgs = getAccessibleOrgs(ctx.userRole)

    if (type === 'eskul') {
      const reg = await prisma.registrationEskul.findUnique({
        where: { id },
        include: { organization: true }
      })

      if (!reg) return NextResponse.json({ error: 'Data pendaftaran tidak ditemukan' }, { status: 404 })
      if (!accessibleOrgs.includes(reg.organization.tipe)) {
        return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
      }

      if (action === 'accept') {
        // Transaction to update registration and create student
        await prisma.$transaction(async (tx) => {
          await tx.registrationEskul.update({
            where: { id },
            data: {
              status: 'DITERIMA',
              accepted_by: ctx.userId,
              accepted_at: new Date(),
              accept_reason: reason
            }
          })

          // Create student record
          await tx.siswa.create({
            data: {
              nama: reg.nama_peserta,
              kelas: reg.kelas,
              email: reg.email_gmail,
              ekskul: reg.organization.tipe as any,
              created_by: ctx.userId,
              nis: reg.nisn
            }
          })
        })
      } else {
        await prisma.registrationEskul.update({
          where: { id },
          data: {
            status: 'DITOLAK',
            rejected_by: ctx.userId,
            rejected_at: new Date(),
            reject_reason: reason
          }
        })
      }
    } else if (type === 'osis-mpk') {
      const reg = await prisma.registrationOsisMpk.findUnique({
        where: { id },
        include: { organization: true }
      })

      if (!reg) return NextResponse.json({ error: 'Data pendaftaran tidak ditemukan' }, { status: 404 })
      if (!accessibleOrgs.includes(reg.organization.tipe)) {
        return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
      }

      if (action === 'accept') {
        await prisma.$transaction(async (tx) => {
          await tx.registrationOsisMpk.update({
            where: { id },
            data: {
              status: 'DITERIMA',
              accepted_by: ctx.userId,
              accepted_at: new Date(),
              accept_reason: reason
            }
          })

          if (reg.organization.tipe === 'osis') {
            await tx.anggotaOsis.create({
              data: {
                nama: reg.nama_peserta,
                kelas: reg.kelas,
                email: reg.email_gmail,
                nis: reg.nisn
              }
            })
          } else {
            await tx.anggotaMpk.create({
              data: {
                nama: reg.nama_peserta,
                kelas: reg.kelas,
                email: reg.email_gmail,
                nis: reg.nisn
              }
            })
          }
        })
      } else {
        await prisma.registrationOsisMpk.update({
          where: { id },
          data: {
            status: 'DITOLAK',
            rejected_by: ctx.userId,
            rejected_at: new Date(),
            reject_reason: reason
          }
        })
      }
    }

    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'UPDATE',
      tabel: type === 'eskul' ? 'registration_eskul' : 'registration_osis_mpk',
      recordId: id.toString(),
      deskripsi: `${ctx.userNama} ${action === 'accept' ? 'menerima' : 'menolak'} pendaftaran ID ${id}`,
      ipAddress: getIp(req)
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[ADMIN REGISTRATION ACTION ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
