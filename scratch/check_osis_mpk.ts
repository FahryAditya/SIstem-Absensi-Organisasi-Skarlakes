import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  try {
    const count = await prisma.registrationOsisMpk.count()
    console.log('Total RegistrationOsisMpk:', count)
    
    const records = await prisma.registrationOsisMpk.findMany({
      take: 5,
      include: { organization: true }
    })
    console.log('Sample Records:', JSON.stringify(records, null, 2))
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

test()
