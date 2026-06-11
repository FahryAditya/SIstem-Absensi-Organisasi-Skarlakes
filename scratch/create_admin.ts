import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

async function main() {
  const prisma = new PrismaClient()
  try {
    const password = 'AdministratorFahry'
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const user = await prisma.user.upsert({
      where: { email: 'Fahryadityasetiawann@gmail.com' },
      update: {
        nama: 'Fahry Aditya Setiawan',
        password: hashedPassword,
        role: 'administrator',
      },
      create: {
        nama: 'Fahry Aditya Setiawan',
        email: 'Fahryadityasetiawann@gmail.com',
        password: hashedPassword,
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
