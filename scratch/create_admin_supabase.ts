import { PrismaClient } from '@prisma/client'

async function main() {
  // Hardcoded Supabase URL from your .env for this fix
  const supabaseUrl = "postgres://postgres.kaivdrixokadghcairwq:AwaxJcOjfrz8WE20@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require";
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: supabaseUrl,
      },
    },
  })

  try {
    const user = await prisma.user.upsert({
      where: { email: 'Fahryadityasetiawann@gmail.com' },
      update: {},
      create: {
        nama: 'Fahry Aditya Setiawan',
        email: 'Fahryadityasetiawann@gmail.com',
        password: 'AdministratorFahry',
        role: 'administrator',
      },
    })
    console.log('User created/verified in SUPABASE:', user.nama)
  } catch (e) {
    console.error('Error in Supabase:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
