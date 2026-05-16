import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const logs = await prisma.logAktivitas.findMany({
    where: { tabel: 'system_updates' },
    orderBy: { created_at: 'desc' },
    take: 10
  })
  console.log(JSON.stringify(logs, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
