import { prisma } from './prisma'
import { Prisma } from '@prisma/client'

/**
 * Tipe client Prisma di dalam transaction (tanpa method-method lifecycle).
 */
export type TxClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

/**
 * Jalankan fungsi di dalam Prisma $transaction dengan mekanisme retry otomatis.
 *
 * Digunakan untuk mencegah race condition saat dua admin OSIS/MPK submit data
 * secara bersamaan. Jika terjadi serialization failure atau deadlock di PostgreSQL,
 * transaksi akan di-retry hingga `maxRetries` kali dengan jeda eksponensial.
 *
 * Isolation level `Serializable` memastikan tidak ada dua transaksi yang bisa
 * membaca + menulis data yang sama secara bersamaan (fully atomic).
 *
 * @param fn      Fungsi yang dijalankan di dalam transaksi
 * @param maxRetries  Jumlah percobaan maksimum (default: 3)
 */
export async function withRetryTransaction<T>(
  fn: (tx: TxClient) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
        timeout: 10_000, // 10 detik max per transaksi
      })
    } catch (err: any) {
      lastError = err

      // Kode P2034 = Prisma serialization failure (deadlock / write conflict)
      const isRetryable =
        err?.code === 'P2034' ||
        err?.message?.includes('deadlock') ||
        err?.message?.includes('could not serialize') ||
        err?.message?.includes('concurrent update')

      if (isRetryable && attempt < maxRetries) {
        // Jeda eksponensial: 100ms, 200ms, 400ms, ...
        await new Promise(r => setTimeout(r, 100 * attempt))
        continue
      }

      throw err
    }
  }

  throw lastError
}

/**
 * Jalankan fungsi di dalam Prisma $transaction standar (tanpa retry).
 * Cocok untuk operasi baca-tulis sederhana yang tidak memerlukan
 * Serializable isolation.
 */
export async function withTransaction<T>(
  fn: (tx: TxClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(fn, { timeout: 10_000 })
}
