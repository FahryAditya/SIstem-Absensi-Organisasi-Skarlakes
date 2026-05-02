import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const absOrg = await prisma.absensiOrganisasi.count()
  console.log({ absensiOrganisasi: absOrg })
}
main().catch(console.error).finally(() => prisma.$disconnect())
