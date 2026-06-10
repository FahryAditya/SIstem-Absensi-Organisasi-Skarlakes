import { PrismaClient, OrganisasiType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Seeding organizations...')

  const orgs = [
    {
      nama: 'OSIS (Organisasi Siswa Intra Sekolah)',
      tipe: OrganisasiType.osis,
      deskripsi: 'Organisasi Siswa Intra Sekolah - Menjadi pemimpin masa depan.',
      hari_pertemuan: 'Jumat',
      waktu_mulai: '14:00',
      waktu_selesai: '16:00',
      lokasi: 'Ruang OSIS'
    },
    {
      nama: 'MPK (Majelis Perwakilan Kelas)',
      tipe: OrganisasiType.mpk,
      deskripsi: 'Majelis Perwakilan Kelas - Suarakan aspirasi teman sekelasmu.',
      hari_pertemuan: 'Kamis',
      waktu_mulai: '15:00',
      waktu_selesai: '17:00',
      lokasi: 'Ruang MPK'
    },
    {
      nama: 'Programming Club',
      tipe: OrganisasiType.programming,
      deskripsi: 'Asah kemampuan coding dan bangun aplikasi impianmu.',
      hari_pertemuan: 'Jumat',
      waktu_mulai: '14:00',
      waktu_selesai: '16:00',
      lokasi: 'Lab Komputer 1'
    },
    {
      nama: 'English Club',
      tipe: OrganisasiType.english,
      deskripsi: 'Improve your speaking skills and master English.',
      hari_pertemuan: 'Rabu',
      waktu_mulai: '15:30',
      waktu_selesai: '17:00',
      lokasi: 'Ruang Kelas 5'
    }
  ]

  for (const org of orgs) {
    // Check if exists by name (since tipe isn't unique in schema)
    const existing = await prisma.organization.findFirst({
      where: { tipe: org.tipe }
    })

    if (!existing) {
      await prisma.organization.create({ data: org })
      console.log(`✅ Created organization: ${org.nama}`)
    } else {
      await prisma.organization.update({
        where: { id: existing.id },
        data: org
      })
      console.log(`ℹ️ Updated organization: ${org.nama}`)
    }
  }

  console.log('✨ Seeding finished!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
