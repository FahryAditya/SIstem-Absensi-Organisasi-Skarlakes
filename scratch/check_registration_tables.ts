import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking registration tables...')
  try {
    // Attempt a dummy query on the tables to see if they exist
    const eskulCount = await prisma.$queryRaw`SELECT count(*) FROM registration_eskul`
    const osisCount = await prisma.$queryRaw`SELECT count(*) FROM registration_osis_mpk`
    
    console.log('✅ Tables found!')
    console.log('Registration Eskul Count:', eskulCount)
    console.log('Registration OSIS MPK Count:', osisCount)
  } catch (error) {
    console.error('❌ Tables not found or query failed:', error)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
