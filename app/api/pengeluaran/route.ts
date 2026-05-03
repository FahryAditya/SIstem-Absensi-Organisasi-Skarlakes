import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessibleOrgs } from '@/lib/auth-shared'
import { createLog, getIp } from '@/lib/log'
import { z } from 'zod'

function getCtx(req: NextRequest) {
  return {
    userId: parseInt(req.headers.get('x-user-id') || '0'),
    userNama: req.headers.get('x-user-nama') || '',
    userRole: req.headers.get('x-user-role') || '',
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userRole } = getCtx(req)
    const { searchParams } = new URL(req.url)
    const orgFilter = searchParams.get('org') || ''

    const accessible = getAccessibleOrgs(userRole)
    const org = (orgFilter && accessible.includes(orgFilter)) ? orgFilter : accessible[0]

    if (!org) {
      return NextResponse.json({ data: [], orgs: [] })
    }

    const whereCondition = userRole === 'administrator' && !orgFilter 
      ? {} 
      : { organisasi_type: org as any }

    const data = await (prisma as any).pengeluaranKas.findMany({
      where: whereCondition,
      include: { creator: { select: { nama: true } } },
      orderBy: { tanggal: 'desc' }
    })

    return NextResponse.json({
      data: data.map((d: any) => ({
        ...d,
        creator_nama: d.creator.nama
      })),
      orgs: accessible,
      activeOrg: org
    })
  } catch (e: any) {
    console.error('[PENGELUARAN GET ERROR]', e)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

const schema = z.object({
  org: z.enum(['programming', 'english', 'osis', 'mpk']),
  nominal: z.number().int().positive('Nominal harus positif'),
  keterangan: z.string().min(1, 'Keterangan wajib diisi'),
})

export async function POST(req: NextRequest) {
  try {
    const ctx = getCtx(req)
    const body = await req.json()
    const parsed = schema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { org, nominal, keterangan } = parsed.data
    const accessible = getAccessibleOrgs(ctx.userRole)

    if (!accessible.includes(org)) {
      return NextResponse.json({ error: 'Akses ditolak untuk unit ini' }, { status: 403 })
    }

    const newExpense = await (prisma as any).pengeluaranKas.create({
      data: {
        organisasi_type: org as any,
        nominal,
        keterangan,
        created_by: ctx.userId,
      }
    })

    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'CREATE',
      tabel: 'pengeluaran_kas',
      recordId: newExpense.id.toString(),
      deskripsi: `${ctx.userNama} menarik kas organisasi ${org.toUpperCase()} sebesar Rp ${nominal.toLocaleString('id-ID')}. Ket: ${keterangan}`,
      ipAddress: getIp(req),
    })

    return NextResponse.json({ success: true, message: 'Pengeluaran kas berhasil dicatat' })
  } catch (e: any) {
    console.error('[PENGELUARAN POST ERROR]', e)
    return NextResponse.json({ error: 'Terjadi kesalahan server saat menyimpan pengeluaran' }, { status: 500 })
  }
}
