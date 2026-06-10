import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

/**
 * Prisma singleton optimised untuk VPS 500 MB dengan 12 concurrent users.
 *
 * Koneksi ke Supabase melalui PgBouncer (transaction-mode) sudah di-pool
 * di sisi Supabase, sehingga limit sisi app bisa kecil (3 koneksi cukup).
 *
 * connection_limit=3  → max 3 koneksi simultan keluar dari proses ini
 * pool_timeout=10     → setelah 10 detik antrian, lempar error (bukan hang)
 * statement_timeout=8000 → query > 8 detik otomatis di-cancel di PostgreSQL
 */
function makePrismaClient() {
  const url = new URL(process.env.DATABASE_URL || '')
  
  // Jika belum ada connection_limit di URL, tambahkan secara programmatik (default 3 untuk low-memory)
  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', '3')
  }
  // Tambahkan pgbouncer=true jika terdeteksi menggunakan port pooler Neon/Supabase (6543/5432)
  if (!url.searchParams.has('pgbouncer') && (url.port === '6543' || url.href.includes('pooler'))) {
    url.searchParams.set('pgbouncer', 'true')
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: url.toString(),
      },
    },
  })
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? makePrismaClient()

// Simpan singleton di global agar tidak buat koneksi baru saat hot-reload (dev)
// Di production Next.js standalone setiap worker sudah berbeda process,
// tapi globalThis tetap berguna untuk request yang berjalan dalam 1 worker.
globalForPrisma.prisma = prisma
