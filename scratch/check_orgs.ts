import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  try {
    const orgs = await prisma.organization.findMany()
    console.log('Organizations:', JSON.stringify(orgs, null, 2))
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

test()
