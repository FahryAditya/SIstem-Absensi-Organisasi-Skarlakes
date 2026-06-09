import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    const users = await prisma.user.findMany()
    console.log('Users found:', users.length)
    users.forEach(u => {
      console.log(`- ${u.nama} (${u.email}) [${u.role}]`)
    })
  } catch (e) {
    console.error('Error:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
