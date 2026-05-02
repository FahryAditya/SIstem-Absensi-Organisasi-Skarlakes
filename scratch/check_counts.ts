import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const siswa = await prisma.siswa.count()
  const absensi = await prisma.absensi.count()
  const osis = await prisma.anggotaOsis.count()
  const mpk = await prisma.anggotaMpk.count()
  console.log({ siswa, absensi, osis, mpk })
}
main().catch(console.error).finally(() => prisma.$disconnect())
