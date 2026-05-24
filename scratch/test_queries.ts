import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Testing prisma.siswa.findMany()...')
    const siswa = await prisma.siswa.findMany({ take: 3 })
    console.log('Siswa retrieved successfully:', siswa.length, 'records')

    console.log('\nTesting prisma.anggotaOsis.findMany()...')
    const osis = await prisma.anggotaOsis.findMany({ take: 3 })
    console.log('AnggotaOsis retrieved:', osis.length, 'records')

    console.log('\nTesting prisma.anggotaMpk.findMany()...')
    const mpk = await prisma.anggotaMpk.findMany({ take: 3 })
    console.log('AnggotaMpk retrieved:', mpk.length, 'records')

    console.log('\nAll queries successful!')
  } catch (error: any) {
    console.error('Error:', error.message)
    console.error('Full error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
