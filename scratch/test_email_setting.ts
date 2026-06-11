import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Attempting to query email_settings...')
    const settings = await prisma.emailSetting.findFirst()
    console.log('Query successful:', settings)
  } catch (error) {
    console.error('Query failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
