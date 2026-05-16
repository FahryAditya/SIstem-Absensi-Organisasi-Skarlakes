import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const updates = await prisma.systemUpdate.findMany({
    orderBy: { created_at: 'desc' },
    include: { creator: { select: { nama: true } } }
  })
  console.log(JSON.stringify(updates, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
