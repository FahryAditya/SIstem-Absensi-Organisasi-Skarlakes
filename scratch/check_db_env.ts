import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.split('@')[1]) // Masking password
  try {
    const tables = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dokumentasi_foto';`
    console.log('Result for dokumentasi_foto:', tables)
  } catch (e) {
    console.error('Error querying tables:', e)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
