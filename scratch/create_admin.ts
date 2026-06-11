import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
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
    console.log('User created/verified:', user.nama)
  } catch (e) {
    console.error('Error:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
