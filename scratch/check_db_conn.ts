import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const dbUrl = process.env.DATABASE_URL || 'not set'
  console.log('Current DATABASE_URL (masked):', dbUrl.replace(/:[^@]+@/, ':****@'))
  
  try {
    const result = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`
    console.log('Tables found:', result)
  } catch (e) {
    console.error('Failed to query tables:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
