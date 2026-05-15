import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Buat Administrator Super Admin (untuk pertama kali jalan)
  const adminEmail = 'Fahryadityasetiawann@gmail.con'
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } })

  if (!existingAdmin) {
    const hashed = await bcrypt.hash('AdministratorFahry', 12)
    const admin = await prisma.user.create({
      data: {
        nama: 'Fahry Aditya Setiawan',
        email: adminEmail,
        password: hashed,
        role: 'administrator',
      },
    })
    console.log(`✅ Created Super Admin: ${admin.email} [${admin.role}]`)

    // 2. Seed contoh siswa (Programming) — oleh admin yang baru dibuat
    const existSiswa = await prisma.siswa.count({ where: { ekskul: 'programming' } })
    if (existSiswa === 0) {
      const siswaProg = ['Andi Pratama', 'Budi Santoso', 'Citra Dewi', 'Dian Rahma', 'Eko Putra']
      for (const nama of siswaProg) {
        await prisma.siswa.create({
          data: { nama, ekskul: 'programming', kelas: 'XI RPL', created_by: admin.id },
        })
      }
      console.log('✅ Seeded: 5 siswa Programming')
    }

    // 3. Seed contoh anggota OSIS
    const existOsis = await prisma.anggotaOsis.count()
    if (existOsis === 0) {
      const anggotaOsis = [
        { nama: 'Ketua OSIS', jabatan: 'Ketua', kelas: 'XI IPA 1' },
        { nama: 'Wakil Ketua', jabatan: 'Wakil Ketua', kelas: 'XI IPS 2' },
      ]
      for (const a of anggotaOsis) {
        await prisma.anggotaOsis.create({ data: a })
      }
      console.log('✅ Seeded: 2 anggota OSIS')
    }
  } else {
    console.log(`⏭️  Skip: ${adminEmail} (sudah ada)`)
  }

  console.log('🎉 Seeding selesai!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())