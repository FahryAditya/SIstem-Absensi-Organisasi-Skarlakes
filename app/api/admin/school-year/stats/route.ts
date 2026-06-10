import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerUser } from '@/lib/server-utils'

export async function GET() {
  try {
    const user = await getServerUser('administrator')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get statistics for Siswa (Eskul: Programming & English)
    const siswaStats = await prisma.siswa.groupBy({
      by: ['ekskul', 'kelas'],
      where: { status: 'ACTIVE' },
      _count: { id: true }
    })

    // Get statistics for OSIS
    const osisStats = await prisma.anggotaOsis.groupBy({
      by: ['kelas'],
      where: { status: 'ACTIVE' },
      _count: { id: true }
    })

    // Get statistics for MPK
    const mpkStats = await prisma.anggotaMpk.groupBy({
      by: ['kelas'],
      where: { status: 'ACTIVE' },
      _count: { id: true }
    })

    // Identify graduating students (Class XII)
    const graduates = {
      osis: await prisma.anggotaOsis.findMany({
        where: { kelas: 'XII', status: 'ACTIVE' },
        select: { id: true, nama: true }
      }),
      mpk: await prisma.anggotaMpk.findMany({
        where: { kelas: 'XII', status: 'ACTIVE' },
        select: { id: true, nama: true }
      }),
      programming: await prisma.siswa.findMany({
        where: { kelas: 'XII', ekskul: 'programming', status: 'ACTIVE' },
        select: { id: true, nama: true }
      }),
      english: await prisma.siswa.findMany({
        where: { kelas: 'XII', ekskul: 'english', status: 'ACTIVE' },
        select: { id: true, nama: true }
      })
    }

    // Check for recent progression
    const recentProgression = await prisma.schoolYearProgression.findFirst({
      orderBy: { executed_at: 'desc' }
    })

    // Format stats for frontend
    const orgStats = {
      osis: {
        total: osisStats.reduce((sum, s) => sum + s._count.id, 0),
        breakdown: osisStats.map(s => ({ class: s.kelas, count: s._count.id }))
      },
      mpk: {
        total: mpkStats.reduce((sum, s) => sum + s._count.id, 0),
        breakdown: mpkStats.map(s => ({ class: s.kelas, count: s._count.id }))
      },
      programming: {
        total: siswaStats.filter(s => s.ekskul === 'programming').reduce((sum, s) => sum + s._count.id, 0),
        breakdown: siswaStats.filter(s => s.ekskul === 'programming').map(s => ({ class: s.kelas, count: s._count.id }))
      },
      english: {
        total: siswaStats.filter(s => s.ekskul === 'english').reduce((sum, s) => sum + s._count.id, 0),
        breakdown: siswaStats.filter(s => s.ekskul === 'english').map(s => ({ class: s.kelas, count: s._count.id }))
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        orgStats,
        graduates,
        recentProgression
      }
    })
  } catch (error: any) {
    console.error('Error fetching school year stats:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
