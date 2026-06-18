import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { createLog, getIp } from '@/lib/log'

function isSuperAdmin(role: string) {
  return role === 'SUPER_ADMIN' || role === 'administrator'
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, action, reason } = body // action: 'accept' | 'reject'

    if (!id || !action) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const reg = await prisma.registration.findUnique({
      where: { id },
      include: { organization: true }
    })

    if (!reg) return NextResponse.json({ error: 'Data pendaftaran tidak ditemukan' }, { status: 404 })

    // RBAC Check
    if (!isSuperAdmin(session.role as string) && !session.orgIds.includes(reg.organization_id)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    if (action === 'accept') {
      await prisma.$transaction(async (tx) => {
        await tx.registration.update({
          where: { id },
          data: { status: 'DITERIMA' }
        })

        // Create member record
        await tx.member.create({
          data: {
            name: reg.name,
            class: reg.class,
            email: reg.email,
            nis: reg.nisn,
            organization_id: reg.organization_id,
            jabatan: 'Anggota'
          }
        })
      })
    } else {
      await prisma.registration.update({
        where: { id },
        data: { status: 'DITOLAK' }
      })
    }

    await createLog({
      userId: session.id,
      userNama: session.nama,
      aksi: 'UPDATE',
      organizationId: reg.organization_id,
      tabel: 'registrations',
      recordId: id.toString(),
      deskripsi: `${session.nama} ${action === 'accept' ? 'menerima' : 'menolak'} pendaftaran "${reg.name}" untuk ${reg.organization.nama}`,
      ipAddress: getIp(req)
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[ADMIN REGISTRATION ACTION ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
