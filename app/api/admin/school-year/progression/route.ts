import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerUser } from '@/lib/server-utils'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
  try {
    const user = await getServerUser('administrator')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { schoolYearFrom, schoolYearTo, notes } = await req.json()

    if (!schoolYearFrom || !schoolYearTo) {
      return NextResponse.json({ error: 'Tahun ajaran asal dan tujuan wajib diisi' }, { status: 400 })
    }

    // Check if there is an in-progress progression
    const activeProgression = await prisma.schoolYearProgression.findFirst({
      where: { status: 'IN_PROGRESS' }
    })
    if (activeProgression) {
      return NextResponse.json({ error: 'Sudah ada proses naik kelas yang sedang berjalan' }, { status: 400 })
    }

    const batchId = uuidv4()

    // Start Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create progression record
      const progression = await tx.schoolYearProgression.create({
        data: {
          batch_id: batchId,
          school_year_from: schoolYearFrom,
          school_year_to: schoolYearTo,
          status: 'COMPLETED', // We'll assume success if transaction finishes
          executed_by: user.id,
          notes
        }
      })

      let totalPromoted = 0
      let totalGraduated = 0

      // Helper to process students
      const processStudents = async (model: any, studentType: string) => {
        const students = await model.findMany({
          where: { status: 'ACTIVE' }
        })

        for (const s of students) {
          let oldClass = s.kelas || 'X'
          let newClass = ''
          let action = ''

          if (oldClass === 'X') {
            newClass = 'XI'
            action = 'PROMOTED'
          } else if (oldClass === 'XI') {
            newClass = 'XII'
            action = 'PROMOTED'
          } else if (oldClass === 'XII') {
            newClass = 'ALUMNI'
            action = 'GRADUATED'
          } else {
            continue // Skip unknown classes
          }

          // Update student
          await model.update({
            where: { id: s.id },
            data: {
              kelas: newClass,
              status: newClass === 'ALUMNI' ? 'ALUMNI' : 'ACTIVE',
              graduation_date: newClass === 'ALUMNI' ? new Date() : null
            }
          })

          // Create log
          await tx.classProgressionLog.create({
            data: {
              progression_id: progression.id,
              student_id: s.id,
              student_type: studentType,
              old_class: oldClass,
              new_class: newClass,
              action: action
            }
          })

          if (action === 'PROMOTED') totalPromoted++
          else totalGraduated++
        }
      }

      // Process all organizations
      await processStudents(tx.siswa, 'SISWA')
      await processStudents(tx.anggotaOsis, 'OSIS')
      await processStudents(tx.anggotaMpk, 'MPK')

      // Update progression counts
      await tx.schoolYearProgression.update({
        where: { id: progression.id },
        data: {
          total_promoted: totalPromoted,
          total_graduated: totalGraduated
        }
      })

      return { totalPromoted, totalGraduated, batchId }
    })

    return NextResponse.json({
      success: true,
      message: 'Proses naik kelas berhasil diselesaikan',
      data: result
    })

  } catch (error: any) {
    console.error('Error during school year progression:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
