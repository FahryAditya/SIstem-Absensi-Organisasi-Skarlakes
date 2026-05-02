import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const siswa = await prisma.siswa.findMany({ select: { id: true, nama: true, ekskul: true } })
  console.log(JSON.stringify(siswa, null, 2))
}
main().catch(console.error).finally(() => prisma.$disconnect())
