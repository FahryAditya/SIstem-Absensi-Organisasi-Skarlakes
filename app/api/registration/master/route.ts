import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [kelas, kejuruan] = await Promise.all([
      prisma.masterKelas.findMany({
        orderBy: { id: 'asc' },
      }),
      prisma.masterKejuruan.findMany({
        orderBy: { skill_group: 'asc' },
      }),
    ])

    return NextResponse.json({
      kelas,
      kejuruan,
    })
  } catch (error: any) {
    console.error('[REGISTRATION MASTER ERROR]', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data master pendaftaran' },
      { status: 500 }
    )
  }
}
