import { prisma } from '../lib/prisma'

async function checkIntegrity() {
  try {
    console.log('Checking Siswa...')
    const siswa = await prisma.siswa.findMany({
      take: 5,
      include: { creator: true }
    })
    console.log('Siswa creators check:', siswa.map(s => s.creator?.nama).filter(Boolean).length)

    console.log('Checking DokumentasiFoto...')
    const dok = await prisma.dokumentasiFoto.findMany({
      take: 5,
      include: { creator: true }
    })
    console.log('DokumentasiFoto creators check:', dok.map(d => d.creator?.nama).filter(Boolean).length)

    console.log('Integrity check successful')
  } catch (error) {
    console.error('Integrity check failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkIntegrity()
