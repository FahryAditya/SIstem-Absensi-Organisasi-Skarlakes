import { PrismaClient } from '@prisma/client'

const TABLES = [
  'users', 'siswa', 'absensi', 'anggota_osis', 'anggota_mpk',
  'absensi_organisasi', 'log_aktivitas', 'pengeluaran_kas',
  'sesi_wawancara', 'antrian_wawancara', 'qr_wawancara',
  'hasil_wawancara', 'chat_wawancara', 'system_updates',
  'dokumentasi_foto', 'pencapaian', 'siswa_pencapaian',
  'materi_hari_ini', 'jadwal_kegiatan', 'exp_log'
]

async function countRecords(prisma: PrismaClient, dbName: string) {
  console.log(`\n${'='.repeat(50)}`)
  console.log(`DATABASE: ${dbName}`)
  console.log('='.repeat(50))
  
  const counts: Record<string, number> = {}
  
  for (const table of TABLES) {
    try {
      const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table}"`)
      counts[table] = Number(result[0]?.count || 0)
    } catch (error: any) {
      counts[table] = -1
      console.log(`  ${table}: ERROR - ${error.message}`)
    }
  }
  
  console.log('\nRecord counts:')
  for (const [table, count] of Object.entries(counts)) {
    if (count >= 0) {
      console.log(`  ${table.padEnd(20)}: ${count}`)
    }
  }
  
  const total = Object.values(counts).filter(c => c >= 0).reduce((a, b) => a + b, 0)
  console.log(`\n  TOTAL RECORDS: ${total}`)
  
  return counts
}

async function main() {
  const results: Record<string, Record<string, number>> = {}
  
  // Test Supabase (using POSTGRES_PRISMA_URL)
  const supabaseDbUrl = process.env.POSTGRES_PRISMA_URL
  if (supabaseDbUrl) {
    console.log('\nConnecting to Supabase database...')
    const supabasePrisma = new PrismaClient({
      datasourceUrl: supabaseDbUrl
    })
    try {
      results['Supabase'] = await countRecords(supabasePrisma, 'Supabase (PostgreSQL)')
    } catch (error: any) {
      console.error(`Supabase connection error: ${error.message}`)
    } finally {
      await supabasePrisma.$disconnect()
    }
  }
  
  // Test Neon (using DATABASE_URL)
  const neonDbUrl = process.env.DATABASE_URL
  if (neonDbUrl) {
    console.log('\nConnecting to Neon database...')
    const neonPrisma = new PrismaClient({
      datasourceUrl: neonDbUrl
    })
    try {
      results['Neon'] = await countRecords(neonPrisma, 'Neon (PostgreSQL)')
    } catch (error: any) {
      console.error(`Neon connection error: ${error.message}`)
    } finally {
      await neonPrisma.$disconnect()
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('SUMMARY')
  console.log('='.repeat(50))
  for (const [db, counts] of Object.entries(results)) {
    const total = Object.values(counts).filter(c => c >= 0).reduce((a, b) => a + b, 0)
    console.log(`${db}: ${total} total records`)
  }
}

main()