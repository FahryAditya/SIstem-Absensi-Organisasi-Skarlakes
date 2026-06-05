import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 1. Check OSIS attendance data with the EXACT query the API uses
  console.log('=== OSIS QUERY (with include + orderBy) ===')
  const osisData = await prisma.absensiOrganisasi.findMany({
    where: { 
      organisasi_type: { in: ['osis'] },
      tanggal: undefined as any, // no date filter
    },
    include: { anggota_osis: true, anggota_mpk: true },
    orderBy: [
      { anggota_osis: { nama: 'asc' } },
      { anggota_mpk: { nama: 'asc' } }
    ],
    take: 50,
  })
  osisData.forEach(a => {
    console.log(`id=${a.id} status=${a.status} osis_id=${a.anggota_osis_id} mpk_id=${a.anggota_mpk_id} osis_nama=${a.anggota_osis?.nama || 'NULL'} mpk_nama=${a.anggota_mpk?.nama || 'NULL'}`)
  })
  console.log(`Total: ${osisData.length}`)

  // 2. Check OSIS attendance WITHOUT orderBy
  console.log('\n=== OSIS QUERY (without orderBy) ===')
  const osisData2 = await prisma.absensiOrganisasi.findMany({
    where: { organisasi_type: 'osis' },
    include: { anggota_osis: true, anggota_mpk: true },
    take: 50,
  })
  osisData2.forEach(a => {
    console.log(`id=${a.id} status=${a.status} osis_nama=${a.anggota_osis?.nama || 'NULL'}`)
  })
  console.log(`Total: ${osisData2.length}`)

  // 3. Distribution by status
  const allStatuses = await prisma.absensiOrganisasi.findMany({
    where: { organisasi_type: 'osis' },
    select: { status: true },
  })
  const counts: Record<string, number> = {}
  allStatuses.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1 })
  console.log('\n=== OSIS Status Distribution ===')
  Object.entries(counts).forEach(([k, v]) => console.log(`${k}: ${v}`))
}

main().catch(console.error).finally(() => prisma.$disconnect())
