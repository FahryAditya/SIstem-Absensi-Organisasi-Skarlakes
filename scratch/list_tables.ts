import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const tables = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;`
  console.log('Tables in public schema:', tables)
  const schemas = await prisma.$queryRaw`SELECT DISTINCT table_schema FROM information_schema.tables;`
  console.log('Schemas in database:', schemas)
}

main().catch(console.error).finally(() => prisma.$disconnect())
