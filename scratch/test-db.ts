import { prisma } from '../lib/prisma'

async function run() {
  try {
    console.log('Querying Siswa...')
    const siswaCount = await prisma.siswa.count()
    console.log('Siswa count:', siswaCount)

    console.log('Querying AnggotaOsis...')
    const osisCount = await prisma.anggotaOsis.count()
    console.log('OSIS count:', osisCount)

    console.log('Querying AnggotaMpk...')
    const mpkCount = await prisma.anggotaMpk.count()
    console.log('MPK count:', mpkCount)

    console.log('Database query successful!')
  } catch (error) {
    console.error('Database query failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

run()
