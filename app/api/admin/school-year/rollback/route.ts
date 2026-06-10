import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerUser } from '@/lib/server-utils'

export async function POST(req: Request) {
  try {
    const user = await getServerUser('administrator')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { batchId } = await req.json()

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID wajib diisi' }, { status: 400 })
    }

    const progression = await prisma.schoolYearProgression.findUnique({
      where: { batch_id: batchId },
      include: { logs: true }
    })

    if (!progression) {
      return NextResponse.json({ error: 'Data progression tidak ditemukan' }, { status: 404 })
    }

    if (progression.status === 'REVERTED') {
      return NextResponse.json({ error: 'Data progression sudah di-revert sebelumnya' }, { status: 400 })
    }

    // Check 48 hour window
    const now = new Date()
    const diff = now.getTime() - progression.executed_at.getTime()
    const hours = diff / (1000 * 60 * 60)

    if (hours > 48) {
      return NextResponse.json({ error: 'Rollback window (48 jam) sudah berakhir' }, { status: 400 })
    }

    // Start Rollback Transaction
    await prisma.$transaction(async (tx) => {
      for (const log of progression.logs) {
        let model: any
        if (log.student_type === 'SISWA') model = tx.siswa
        else if (log.student_type === 'OSIS') model = tx.anggotaOsis
        else if (log.student_type === 'MPK') model = tx.anggotaMpk
        else continue

        await model.update({
          where: { id: log.student_id },
          data: {
            kelas: log.old_class,
            status: 'ACTIVE', // All reverted students become active again
            graduation_date: null
          }
        })
      }

      // Update progression status
      await tx.schoolYearProgression.update({
        where: { id: progression.id },
        data: {
          status: 'REVERTED',
          reverted_at: new Date(),
          reverted_by: user.id
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Rollback berhasil diselesaikan'
    })

  } catch (error: any) {
    console.error('Error during school year rollback:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
