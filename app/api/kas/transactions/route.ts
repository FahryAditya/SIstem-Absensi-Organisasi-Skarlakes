import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
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

function isSuperAdmin(role: string) {
  return role === 'SUPER_ADMIN' || role === 'administrator' || role === 'admin_osis_mpk'
}

const transactionSchema = z.object({
  member_id: z.number().int().positive(),
  amount: z.number().min(1, 'Jumlah minimal 1'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  type: z.enum(['INCOME', 'EXPENSE']).default('INCOME')
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { searchParams } = new URL(req.url)
    const ctx = getCtx(req)
    const activeOrgId = ctx.activeOrgId
    
    if (!activeOrgId && !isSuperAdmin(session.role as string)) {
      return NextResponse.json({ error: 'No active organization selected' }, { status: 400 })
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const memberId = searchParams.get('member_id')

    const where: any = {
      ...(activeOrgId ? { organization_id: activeOrgId } : {}),
      ...(memberId ? { member_id: parseInt(memberId) } : {})
    }

    const [transactions, total] = await Promise.all([
      prisma.cashTransaction.findMany({
        where,
        include: {
          member: {
            select: { name: true, class: true }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.cashTransaction.count({ where })
    ])

    return NextResponse.json({
      data: transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })

  } catch (error) {
    console.error('Get kas transactions error:', error)
    return NextResponse.json({ error: 'Gagal memuat data kas' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ctx = getCtx(req)
    const activeOrgId = ctx.activeOrgId

    if (!activeOrgId) {
      return NextResponse.json({ error: 'No active organization selected' }, { status: 400 })
    }

    const body = await req.json()
    const parsed = transactionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { member_id, amount, description, type } = parsed.data

    // Verify member belongs to active organization
    const member = await prisma.member.findFirst({
      where: { 
        id: member_id, 
        organization_id: activeOrgId 
      },
      select: { id: true, name: true }
    })

    if (!member) {
      return NextResponse.json({ error: 'Anggota tidak ditemukan dalam organisasi ini' }, { status: 403 })
    }

    // Create transaction with explicit organization context
    const transaction = await prisma.cashTransaction.create({
      data: {
        organization_id: activeOrgId,
        member_id,
        amount: type === 'EXPENSE' ? -Math.abs(amount) : Math.abs(amount),
        description,
        type,
      },
      include: {
        member: {
          select: { name: true, class: true }
        }
      }
    })

    // Verify the transaction was saved correctly
    const verification = await prisma.cashTransaction.findUnique({
      where: { id: transaction.id },
      select: { id: true, amount: true, organization_id: true }
    })

    if (!verification || verification.organization_id !== activeOrgId) {
      throw new Error('Data persistence verification failed')
    }

    // Log the transaction
    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'CREATE',
      organizationId: activeOrgId,
      tabel: 'cash_transactions',
      recordId: transaction.id.toString(),
      deskripsi: `Transaksi kas ${type.toLowerCase()}: ${member.name} - ${description} (${amount})`,
      dataBaru: { member_id, amount, description, type },
      ipAddress: getIp(req)
    })

    return NextResponse.json({
      success: true,
      data: transaction,
      message: 'Transaksi kas berhasil disimpan dan diverifikasi'
    })

  } catch (error) {
    console.error('Create kas transaction error:', error)
    return NextResponse.json({ 
      error: 'Gagal menyimpan transaksi kas. Silakan coba lagi.' 
    }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ctx = getCtx(req)
    const { searchParams } = new URL(req.url)
    const transactionId = searchParams.get('id')

    if (!transactionId) {
      return NextResponse.json({ error: 'ID transaksi diperlukan' }, { status: 400 })
    }

    const activeOrgId = ctx.activeOrgId
    if (!activeOrgId && !isSuperAdmin(session.role as string)) {
      return NextResponse.json({ error: 'No active organization selected' }, { status: 400 })
    }

    // Verify transaction belongs to user's organization
    const transaction = await prisma.cashTransaction.findFirst({
      where: { 
        id: parseInt(transactionId),
        ...(activeOrgId ? { organization_id: activeOrgId } : {})
      },
      include: { member: { select: { name: true } } }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
    }

    // Delete the transaction
    await prisma.cashTransaction.delete({
      where: { id: transaction.id }
    })

    // Log the deletion
    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'DELETE',
      organizationId: transaction.organization_id,
      tabel: 'cash_transactions',
      recordId: transaction.id.toString(),
      deskripsi: `Hapus transaksi kas: ${transaction.member.name} - ${transaction.description} (${transaction.amount})`,
      dataLama: transaction,
      ipAddress: getIp(req)
    })

    return NextResponse.json({
      success: true,
      message: 'Transaksi berhasil dihapus'
    })

  } catch (error) {
    console.error('Delete kas transaction error:', error)
    return NextResponse.json({ 
      error: 'Gagal menghapus transaksi kas' 
    }, { status: 500 })
  }
}