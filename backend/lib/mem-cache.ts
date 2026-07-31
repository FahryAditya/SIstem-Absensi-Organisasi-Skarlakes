/**
 * Lightweight in-memory TTL cache untuk server-side (Node.js / Next.js API Routes).
 *
 * Tujuan: mengurangi jumlah query Prisma ketika 12 user membuka halaman
 * yang sama dalam waktu berdekatan. Dengan TTL 30 detik, query berat seperti
 * dashboard/stats hanya dijalankan sekali per 30 detik, bukan 12x.
 *
 * ⚠️  Cache ini hidup di dalam process memory — bukan shared antar process.
 *     Untuk VPS single-worker ini sudah cukup.
 *     Jika scaling ke multi-worker, ganti dengan Redis.
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

// Map utama — key string → CachedEntry
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = new Map<string, CacheEntry<any>>()

// Bersihkan entry expired setiap 60 detik agar RAM tidak menumpuk
let cleanupTimer: ReturnType<typeof setInterval> | null = null
function ensureCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of Array.from(store.entries())) {
      if (entry.expiresAt < now) store.delete(key)
    }
  }, 60_000)
  // Jangan blok process exit
  if (cleanupTimer.unref) cleanupTimer.unref()
}

/**
 * Ambil data dari cache; jika miss / expired, jalankan `loader` lalu simpan.
 *
 * @param key    - cache key unik
 * @param ttlMs  - time-to-live dalam milidetik (default 30 detik)
 * @param loader - async function yang menghasilkan data
 */
export async function cacheGet<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  ensureCleanup()

  const now = Date.now()
  const cached = store.get(key)

  if (cached && cached.expiresAt > now) {
    return cached.data as T
  }

  // Muat data segar
  const data = await loader()
  store.set(key, { data, expiresAt: now + ttlMs })
  return data
}

/**
 * Hapus satu cache entry (misal: setelah mutasi data).
 */
export function cacheInvalidate(key: string): void {
  store.delete(key)
}

/**
 * Hapus semua entry yang key-nya dimulai dengan prefix.
 * Berguna untuk invalidate per-organisasi, misal prefix 'dashboard:'.
 */
export function cacheInvalidatePrefix(prefix: string): void {
  for (const key of Array.from(store.keys())) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}

/**
 * Jumlah entry aktif (untuk monitoring / debug).
 */
export function cacheSize(): number {
  return store.size
}
