import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== CHECKING SISWA ===')
  const siswa = await prisma.siswa.findMany({ take: 5 })
  console.log('Siswa count:', await prisma.siswa.count())
  siswa.forEach(s => console.log(`- [Siswa] ID: ${s.id}, Nama: ${s.nama}, Ekskul: ${s.ekskul}`))

  console.log('\n=== CHECKING OSIS ===')
  const osis = await prisma.anggotaOsis.findMany({ take: 5 })
  console.log('Osis count:', await prisma.anggotaOsis.count())
  osis.forEach(o => console.log(`- [OSIS] ID: ${o.id}, Nama: ${o.nama}, Level: ${o.level}`))

  console.log('\n=== CHECKING MPK ===')
  const mpk = await prisma.anggotaMpk.findMany({ take: 5 })
  console.log('Mpk count:', await prisma.anggotaMpk.count())
  mpk.forEach(m => console.log(`- [MPK] ID: ${m.id}, Nama: ${m.nama}, Level: ${m.level}`))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
