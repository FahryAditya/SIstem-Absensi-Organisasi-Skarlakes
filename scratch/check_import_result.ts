import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    const osis = await prisma.anggotaOsis.count()
    const mpk = await prisma.anggotaMpk.count()
    const siswa = await prisma.siswa.count()
    
    console.log('--- DATABASE STATS ---')
    console.log('Anggota OSIS:', osis)
    console.log('Anggota MPK:', mpk)
    console.log('Siswa (Ekskul):', siswa)
    
    const sampleOsis = await prisma.anggotaOsis.findMany({ take: 5 })
    if (sampleOsis.length > 0) {
      console.log('\nSample OSIS:')
      sampleOsis.forEach(s => console.log(`- ${s.nama} (${s.kelas})`))
    }
  } catch (e) {
    console.error('Error:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
