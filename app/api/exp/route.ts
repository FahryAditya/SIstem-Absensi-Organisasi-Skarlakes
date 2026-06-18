import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { updateExp } from '@/lib/exp'
import { getSessionFromRequest } from '@/lib/auth'
import { z } from 'zod'

const postSchema = z.object({
  memberId: z.number().int().positive(),
  amount: z.number().int().refine((n) => n !== 0, 'Selisih tidak boleh 0'),
  reason: z.string().min(3, 'Alasan minimal 3 karakter').max(500),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const orgId = searchParams.get('orgId')
    const memberId = searchParams.get('memberId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const filterOrgId = orgId ? parseInt(orgId) : session.activeOrgId

    if (!filterOrgId && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No active organization selected' }, { status: 400 })
    }

    // RBAC Check
    if (session.role !== 'SUPER_ADMIN' && filterOrgId && !session.orgIds.includes(filterOrgId)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const where: any = {
      ...(filterOrgId ? { organization_id: filterOrgId } : {}),
      ...(memberId ? { member_id: parseInt(memberId) } : {})
    }

    const [data, total] = await Promise.all([
      prisma.expLog.findMany({
        where,
        include: { 
          member: { select: { name: true, class: true } },
          admin: { select: { nama: true } }
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expLog.count({ where }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('[EXP LOG ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { memberId, amount, reason } = parsed.data

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { organization_id: true, name: true }
    })

    if (!member) return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 })

    // RBAC Check
    if (session.role !== 'SUPER_ADMIN' && !session.orgIds.includes(member.organization_id)) {
      return NextResponse.json({ error: 'Akses ditolak untuk organisasi ini' }, { status: 403 })
    }

    const result = await updateExp({
      targetId: memberId,
      selisih: amount,
      alasan: `[Manual Admin] ${reason}`,
      adminId: session.id,
      organizationId: member.organization_id,
    })

    await createLog({
      userId: session.id,
      userNama: session.nama,
      aksi: 'UPDATE',
      organizationId: member.organization_id,
      tabel: 'members',
      recordId: memberId,
      deskripsi: `${session.nama} mengubah EXP "${member.name}" sebesar ${amount > 0 ? '+' : ''}${amount}. Alasan: ${reason}`,
      dataLama: { xp: result.xpBaru - amount, level: result.levelLama },
      dataBaru: { xp: result.xpBaru, level: result.levelBaru },
      ipAddress: getIp(req),
    })

    return NextResponse.json({
      success: true,
      xpBaru: result.xpBaru,
      levelBaru: result.levelBaru,
      levelNaik: result.levelNaik,
    })
  } catch (error: any) {
    console.error('[EXP POST ERROR]', error)
    return NextResponse.json({ error: 'Gagal update EXP' }, { status: 500 })
  }
}
