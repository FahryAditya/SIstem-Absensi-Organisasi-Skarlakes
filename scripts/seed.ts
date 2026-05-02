import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const users = [
  // Administrator (1)
  {
    nama: 'Fahry Aditya',
    email: 'Fahryadityaadmin@gmail.com',
    password: 'AdministratorFahry',
    role: 'administrator' as const,
  },
  // Admin Programming (3)
  {
    nama: 'Admin Programming 1',
    email: 'programmingakarlakes1@gmail.com',
    password: 'pgskarlakes1',
    role: 'admin_programming' as const,
  },
  {
    nama: 'Admin Programming 2',
    email: 'programmingakarlakes2@gmail.com',
    password: 'pgskarlakes2',
    role: 'admin_programming' as const,
  },
  {
    nama: 'Admin Programming 3',
    email: 'programmingakarlakes3@gmail.com',
    password: 'pgskarlakes3',
    role: 'admin_programming' as const,
  },
  // Admin English Club (3)
  {
    nama: 'Admin English Club 1',
    email: 'Englishclubskarla1@gmail.com',
    password: 'EnglishSkarla1',
    role: 'admin_english' as const,
  },
  {
    nama: 'Admin English Club 2',
    email: 'Englishclubskarla2@gmail.com',
    password: 'EnglishSkarla2',
    role: 'admin_english' as const,
  },
  {
    nama: 'Admin English Club 3',
    email: 'Englishclubskarla3@gmail.com',
    password: 'EnglishSkarla3',
    role: 'admin_english' as const,
  },
  // Admin OSIS & MPK (3)
  {
    nama: 'Admin OSIS & MPK 1',
    email: 'osismpkskarlakes1@gmail.com',
    password: 'osismpk1',
    role: 'admin_osis_mpk' as const,
  },
  {
    nama: 'Admin OSIS & MPK 2',
    email: 'osismpkskarlakes2@gmail.com',
    password: 'osismpk2',
    role: 'admin_osis_mpk' as const,
  },
  {
    nama: 'Admin OSIS & MPK 3',
    email: 'osismpkskarlakes3@gmail.com',
    password: 'osismpk3',
    role: 'admin_osis_mpk' as const,
  },
]

async function main() {
  console.log('🌱 Seeding database...')

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } })
    if (existing) {
      console.log(`⏭️  Skip: ${u.email} (sudah ada)`)
      continue
    }
    const hashed = await bcrypt.hash(u.password, 12)
    await prisma.user.create({
      data: { nama: u.nama, email: u.email, password: hashed, role: u.role }
    })
    console.log(`✅ Created: ${u.email} [${u.role}]`)
  }

  // Seed contoh siswa
  const adminProg = await prisma.user.findFirst({ where: { role: 'admin_programming' } })
  const adminEng = await prisma.user.findFirst({ where: { role: 'admin_english' } })

  if (adminProg) {
    const existSiswa = await prisma.siswa.count({ where: { ekskul: 'programming' } })
    if (existSiswa === 0) {
      const siswaProg = ['Andi Pratama', 'Budi Santoso', 'Citra Dewi', 'Dian Rahma', 'Eko Putra']
      for (const nama of siswaProg) {
        await prisma.siswa.create({ data: { nama, ekskul: 'programming', kelas: 'XI RPL', created_by: adminProg.id } })
      }
      console.log('✅ Seeded: 5 siswa Programming')
    }
  }

  if (adminEng) {
    const existSiswa = await prisma.siswa.count({ where: { ekskul: 'english' } })
    if (existSiswa === 0) {
      const siswaEng = ['Fajar Hidayat', 'Gita Lestari', 'Hendra Wijaya', 'Indah Permata', 'Joko Susilo']
      for (const nama of siswaEng) {
        await prisma.siswa.create({ data: { nama, ekskul: 'english', kelas: 'X IPA', created_by: adminEng.id } })
      }
      console.log('✅ Seeded: 5 siswa English Club')
    }
  }

  // Seed contoh anggota OSIS
  const existOsis = await prisma.anggotaOsis.count()
  if (existOsis === 0) {
    const anggotaOsis = [
      { nama: 'Ketua OSIS', jabatan: 'Ketua', kelas: 'XI IPA 1' },
      { nama: 'Wakil Ketua', jabatan: 'Wakil Ketua', kelas: 'XI IPS 2' },
      { nama: 'Sekretaris OSIS', jabatan: 'Sekretaris', kelas: 'X IPA 3' },
    ]
    for (const a of anggotaOsis) {
      await prisma.anggotaOsis.create({ data: a })
    }
    console.log('✅ Seeded: 3 anggota OSIS')
  }

  // Seed contoh anggota MPK
  const existMpk = await prisma.anggotaMpk.count()
  if (existMpk === 0) {
    const anggotaMpk = [
      { nama: 'Ketua MPK', jabatan: 'Ketua', kelas: 'XII IPA 1' },
      { nama: 'Wakil Ketua MPK', jabatan: 'Wakil Ketua', kelas: 'XII IPS 1' },
    ]
    for (const a of anggotaMpk) {
      await prisma.anggotaMpk.create({ data: a })
    }
    console.log('✅ Seeded: 2 anggota MPK')
  }

  console.log('🎉 Seeding selesai!')
}

main()
  .catch(e => { console.error('❌ Seed error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
