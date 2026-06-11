import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()
  console.log(`Found ${users.length} users.`)

  let updatedCount = 0
  for (const user of users) {
    const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$')
    if (!isHashed) {
      console.log(`Hashing password for user: ${user.email}`)
      const hashedPassword = bcrypt.hashSync(user.password, 10)
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      })
      updatedCount++
    }
  }

  console.log(`Migration complete. ${updatedCount} users updated.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
