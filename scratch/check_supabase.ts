import { PrismaClient } from '@prisma/client'

async function main() {
  const supabaseUrl = process.env.SUPABASE_DATABASE_URL
  if (!supabaseUrl) {
    console.log('SUPABASE_DATABASE_URL not found')
    return
  }
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: supabaseUrl
      }
    }
  })

  try {
    const tables = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dokumentasi_foto';`
    console.log('Supabase check for dokumentasi_foto:', tables)
  } catch (e) {
    console.log('Error checking Supabase:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
