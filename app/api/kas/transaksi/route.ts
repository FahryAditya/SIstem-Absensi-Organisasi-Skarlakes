import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLog, getIp } from '@/lib/log'
import { z } from 'zod'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
    activeOrgId: req.headers.get('x-active-org-id') ? parseInt(req.headers.get('x-active-org-id')!) : undefined
  }
}

const schema = z.object({
  member_id: z.number().int().positive(),
  amount: z.number().int(), // positive for income, negative for expense
  description: z.string().min(1, 'Keterangan wajib diisi'),
})

export async function POST(req: NextRequest) {
  try {
    const ctx = getCtx(req)
    const activeOrgId = ctx.activeOrgId

    if (!activeOrgId) {
      return NextResponse.json({ error: 'No active organization selected' }, { status: 400 })
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { member_id, amount, description } = parsed.data

    if (amount === 0) {
      return NextResponse.json({ error: 'Nominal tidak boleh nol' }, { status: 400 })
    }

    // Verify member belongs to organization
    const member = await prisma.member.findUnique({
      where: { id: member_id, organization_id: activeOrgId }
    })

    if (!member) {
      return NextResponse.json({ error: 'Anggota tidak valid untuk organisasi ini' }, { status: 403 })
    }

    const transaction = await prisma.cashTransaction.create({
      data: {
        organization_id: activeOrgId,
        member_id: member_id,
        amount: Math.abs(amount),
        type: amount > 0 ? 'INCOME' : 'EXPENSE',
        description: description
      }
    })

    const actionText = amount > 0 ? 'menambahkan' : 'mengurangi'
    const absAmount = Math.abs(amount)

    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'CREATE',
      organizationId: activeOrgId,
      tabel: 'cash_transactions',
      recordId: transaction.id.toString(),
      deskripsi: `${actionText} kas Rp ${absAmount.toLocaleString('id-ID')} untuk ${member.name}. Ket: ${description}`,
      ipAddress: getIp(req),
    })

    return NextResponse.json({ success: true, message: 'Transaksi kas berhasil disimpan' })
  } catch (e: any) {
    console.error('[KAS TRANSAKSI ERROR]', e)
    return NextResponse.json({ error: 'Terjadi kesalahan server saat menyimpan kas' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { userRole, activeOrgId } = getCtx(req)
  const { searchParams } = new URL(req.url)

  const filterOrgId = userRole === 'SUPER_ADMIN' ? (searchParams.get('orgId') ? parseInt(searchParams.get('orgId')!) : activeOrgId) : activeOrgId

  if (!filterOrgId && userRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No active organization selected' }, { status: 400 })
  }

  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where = filterOrgId ? { organization_id: filterOrgId } : {}

  const [data, total] = await Promise.all([
    prisma.cashTransaction.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { 
        member: { select: { name: true, class: true } },
        organization: { select: { nama: true } }
      }
    }),
    prisma.cashTransaction.count({ where }),
  ])

  return NextResponse.json({ 
    data, 
    total, 
    page, 
    totalPages: Math.ceil(total / limit) 
  })
}
