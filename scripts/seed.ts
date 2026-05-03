import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Load users dari script/users.json jika ada
  let jsonUsers: any[] = []
  const jsonPath = path.join(process.cwd(), 'script', 'users.json')
  
  if (fs.existsSync(jsonPath)) {
    try {
      const content = fs.readFileSync(jsonPath, 'utf-8')
      jsonUsers = JSON.parse(content).map((u: any) => ({
        nama: u.nama,
        email: u.email,
        password: u.pw || u.password, // Menangani field 'pw' atau 'password'
        role: u.role || 'administrator' // Default ke administrator jika tidak ada
      }))
      console.log(`📂 Berhasil memuat ${jsonUsers.length} user dari ${jsonPath}`)
    } catch (err) {
      console.error('⚠️ Gagal membaca users.json:', err)
    }
  }

  // Gabungkan semua user (Hanya dari JSON)
  const allUsers = [...jsonUsers]

  for (const u of allUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } })
    if (existing) {
      console.log(`⏭️  Skip: ${u.email} (sudah ada)`)
      continue
    }
    const hashed = await bcrypt.hash(u.password, 12)
    await prisma.user.create({
      data: { 
        nama: u.nama, 
        email: u.email, 
        password: hashed, 
        role: u.role as any 
      }
    })
    console.log(`✅ Created: ${u.email} [${u.role}]`)
  }

  // 3. Seed contoh siswa (Programming)
  const adminProg = await prisma.user.findFirst({ where: { role: 'admin_programming' } })
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

  // 4. Seed contoh anggota OSIS
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

  console.log('🎉 Seeding selesai!')
}

main()
  .catch(e => { console.error('❌ Seed error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
