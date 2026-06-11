import { PrismaClient, SkillGroup, OrganisasiType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // 1. Seed MasterKelas
  const kelasData = [
    { kelas_nama: 'X', kelas_singkat: 'X', tingkat: 'Kelas 10' },
    { kelas_nama: 'XI', kelas_singkat: 'XI', tingkat: 'Kelas 11' },
  ]

  for (const k of kelasData) {
    await prisma.masterKelas.upsert({
      where: { kelas_nama: k.kelas_nama },
      update: k,
      create: k,
    })
  }
  console.log('MasterKelas seeded.')

  // 2. Seed MasterKejuruan
  const kejuruanData = [
    // SKARLA
    { kejuruan_kode: 'DKV', kejuruan_nama: 'Desain Komunikasi Visual', kejuruan_singkat: 'DKV', skill_group: SkillGroup.SKARLA },
    { kejuruan_kode: 'PPLG', kejuruan_nama: 'Pengembangan Perangkat Lunak dan Gim', kejuruan_singkat: 'PPLG', skill_group: SkillGroup.SKARLA },
    { kejuruan_kode: 'MPLB 1', kejuruan_nama: 'Multimedia Produksi Lanjutan Broadcast 1', kejuruan_singkat: 'MPLB 1', skill_group: SkillGroup.SKARLA },
    { kejuruan_kode: 'MPLB 2', kejuruan_nama: 'Multimedia Produksi Lanjutan Broadcast 2', kejuruan_singkat: 'MPLB 2', skill_group: SkillGroup.SKARLA },
    { kejuruan_kode: 'AKL', kejuruan_nama: 'Akuntansi dan Keuangan Lanjutan', kejuruan_singkat: 'AKL', skill_group: SkillGroup.SKARLA },
    { kejuruan_kode: 'TJKT', kejuruan_nama: 'Teknik Jaringan Komputer dan Telekomunikasi', kejuruan_singkat: 'TJKT', skill_group: SkillGroup.SKARLA },
    
    // SKAKES
    { kejuruan_kode: 'AKC 1', kejuruan_nama: 'Akomodasi Perhotelan 1', kejuruan_singkat: 'AKC 1', skill_group: SkillGroup.SKAKES },
    { kejuruan_kode: 'AKC 2', kejuruan_nama: 'Akomodasi Perhotelan 2', kejuruan_singkat: 'AKC 2', skill_group: SkillGroup.SKAKES },
    { kejuruan_kode: 'AKC 3', kejuruan_nama: 'Akomodasi Perhotelan 3', kejuruan_singkat: 'AKC 3', skill_group: SkillGroup.SKAKES },
    { kejuruan_kode: 'AKC 4', kejuruan_nama: 'Akomodasi Perhotelan 4', kejuruan_singkat: 'AKC 4', skill_group: SkillGroup.SKAKES },
    { kejuruan_kode: 'AKC 5', kejuruan_nama: 'Akomodasi Perhotelan 5', kejuruan_singkat: 'AKC 5', skill_group: SkillGroup.SKAKES },
    { kejuruan_kode: 'AKC 6', kejuruan_nama: 'Akomodasi Perhotelan 6', kejuruan_singkat: 'AKC 6', skill_group: SkillGroup.SKAKES },
    { kejuruan_kode: 'TLM', kejuruan_nama: 'Tata Laksana Makanan', kejuruan_singkat: 'TLM', skill_group: SkillGroup.SKAKES },
    { kejuruan_kode: 'FARMASI', kejuruan_nama: 'Farmasi', kejuruan_singkat: 'FARMASI', skill_group: SkillGroup.SKAKES },
  ]

  for (const kj of kejuruanData) {
    await prisma.masterKejuruan.upsert({
      where: { kejuruan_kode: kj.kejuruan_kode },
      update: kj,
      create: kj,
    })
  }
  console.log('MasterKejuruan seeded.')

  // 3. Update Existing Organizations with Schedules
  const orgUpdates = [
    { 
      tipe: OrganisasiType.programming, 
      deskripsi: 'Belajar coding dan game development', 
      hari_pertemuan: 'Jumat', 
      waktu_mulai: '14:00', 
      waktu_selesai: '16:00', 
      lokasi: 'Lab Komputer 1' 
    },
    { 
      tipe: OrganisasiType.english, 
      deskripsi: 'Meningkatkan kemampuan Bahasa Inggris', 
      hari_pertemuan: 'Rabu', 
      waktu_mulai: '15:30', 
      waktu_selesai: '17:00', 
      lokasi: 'Ruang Kelas 5' 
    },
    { 
      tipe: OrganisasiType.osis, 
      deskripsi: 'Organisasi Siswa Intra Sekolah', 
      hari_pertemuan: 'Jumat', 
      waktu_mulai: '14:00', 
      waktu_selesai: '16:00', 
      lokasi: 'Ruang OSIS' 
    },
    { 
      tipe: OrganisasiType.mpk, 
      deskripsi: 'Majelis Perwakilan Kelas', 
      hari_pertemuan: 'Kamis', 
      waktu_mulai: '15:00', 
      waktu_selesai: '17:00', 
      lokasi: 'Ruang MPK' 
    },
  ]

  for (const ou of orgUpdates) {
    await prisma.organization.updateMany({
      where: { tipe: ou.tipe },
      data: {
        deskripsi: ou.deskripsi,
        hari_pertemuan: ou.hari_pertemuan,
        waktu_mulai: ou.waktu_mulai,
        waktu_selesai: ou.waktu_selesai,
        lokasi: ou.lokasi,
      }
    })
  }
  console.log('Organizations updated.')

  console.log('Seed finished successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
