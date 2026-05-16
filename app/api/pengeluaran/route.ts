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

    const [data, totalKasData, totalPengeluaran] = await Promise.all([
      (prisma as any).pengeluaranKas.findMany({
        where: whereCondition,
        include: { creator: { select: { nama: true } } },
        orderBy: { tanggal: 'desc' }
      }),
      org === 'programming' || org === 'english' 
        ? prisma.absensi.aggregate({ where: { siswa: { ekskul: org as any } }, _sum: { uang_kas: true } })
        : prisma.absensiOrganisasi.aggregate({ where: { organisasi_type: org as any }, _sum: { uang_kas: true } }),
      prisma.pengeluaranKas.aggregate({ where: { organisasi_type: org as any }, _sum: { nominal: true } })
    ])

    const balance = (totalKasData._sum?.uang_kas || 0) - (totalPengeluaran._sum?.nominal || 0)

    return NextResponse.json({
      data: data.map((d: any) => ({
        ...d,
        creator_nama: d.creator.nama
      })),
      totalKas: balance,
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

export async function DELETE(req: NextRequest) {
  try {
    const ctx = getCtx(req)
    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id') || '0')

    if (!id) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })

    const expense = await (prisma as any).pengeluaranKas.findUnique({
      where: { id }
    })

    if (!expense) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })

    const accessible = getAccessibleOrgs(ctx.userRole)
    if (!accessible.includes(expense.organisasi_type)) {
      return NextResponse.json({ error: 'Akses ditolak untuk unit ini' }, { status: 403 })
    }

    await (prisma as any).pengeluaranKas.delete({
      where: { id }
    })

    await createLog({
      userId: ctx.userId,
      userNama: ctx.userNama,
      aksi: 'DELETE',
      tabel: 'pengeluaran_kas',
      recordId: id.toString(),
      deskripsi: `${ctx.userNama} MENGHAPUS/MEMBATALKAN pengeluaran kas ${expense.organisasi_type.toUpperCase()} sebesar Rp ${expense.nominal.toLocaleString('id-ID')}. Ket: ${expense.keterangan}`,
      ipAddress: getIp(req),
    })

    return NextResponse.json({ success: true, message: 'Transaksi pengeluaran berhasil dibatalkan/dihapus' })
  } catch (e: any) {
    console.error('[PENGELUARAN DELETE ERROR]', e)
    return NextResponse.json({ error: 'Terjadi kesalahan server saat menghapus pengeluaran' }, { status: 500 })
  }
}
