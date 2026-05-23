import { prisma } from '../lib/prisma'

async function testMultiStatement() {
  try {
    console.log('Testing multi-statement $executeRawUnsafe...')
    await prisma.$executeRawUnsafe(`
      SELECT 1;
      SELECT 2;
    `)
    console.log('Success!')
  } catch (error) {
    console.error('Failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testMultiStatement()
