# 🔒 Planning Perbaikan Backend & Integritas Data — Sistem Ekstrakurikuler (Artemis Series)

## Analisis Kondisi Saat Ini

Backend menggunakan Next.js 14 API Routes + Prisma 5 + PostgreSQL/Supabase. Validasi menggunakan Zod di beberapa route. Namun ditemukan banyak celah pada: error handling, validasi data, race condition, cache management, keamanan, dan mekanisme penyimpanan data yang bisa menyebabkan data hilang, ganda, atau tidak terupdate.

---

## 🔴 Prioritas P0 — Kritis (Harus Segera)

### Task 1: Penanganan Error API yang Tidak Konsisten
**Masalah yang Ditemukan:**
- Beberapa API route memiliki `try/catch` dengan error message generik ("Terjadi kesalahan server"), sementara yang lain **tidak punya try/catch sama sekali**
- `app/api/siswa/route.ts` — **tidak ada try/catch** di GET, POST, PUT, DELETE. Jika Prisma error (koneksi DB timeout, unique constraint), user mendapat error 500 tanpa pesan jelas
- `app/api/absensi/route.ts` — tidak ada try/catch di POST, transaksi batch bisa gagal di tengah tanpa rollback yang jelas
- `app/api/dashboard/route.ts` — tidak ada try/catch di level atas, error di `$queryRaw` bisa crash seluruh response
- Client-side: `fetchJsonCached` di `lib/client-cache.ts` hanya throw generic error "Gagal memuat data" tanpa detail status code atau konteks

**Solusi:**
- **Wajibkan try/catch** di SEMUA API route dengan format error response yang konsisten:
  ```json
  { "error": "Pesan spesifik", "code": "VALIDATION_ERROR", "field": "name" }
  ```
- Tambahkan global error handler middleware untuk API routes yang menangkap error tak tertangani
- Di client, buat custom `fetchApi()` wrapper yang:
  - Parse error response secara konsisten
  - Tampilkan pesan spesifik (bukan "Gagal memuat data")
  - Log error detail ke console untuk debugging
  - Retry otomatis untuk network errors (max 2x)

**File terkait:** Semua `app/api/*/route.ts`, `lib/client-cache.ts`, buat `lib/api-client.ts`

---

### Task 2: Race Condition & Data Tidak Terupdate
**Masalah yang Ditemukan:**
- **Absensi batch:** `POST /api/absensi` melakukan upsert dalam loop `$transaction`. Jika 2 admin menyimpan absensi bersamaan untuk tanggal yang sama, data bisa saling timpa tanpa peringatan
- **Kas transaksi:** `POST /api/kas/transaksi` tidak ada unique constraint check — transaksi ganda bisa terjadi jika user klik tombol 2x dengan cepat
- **Dashboard cache:** `cacheGet` di `lib/mem-cache.ts` menggunakan TTL 30 detik. Jika data berubah tapi cache belum expired, dashboard menampilkan angka lama → user bingung "kok tidak berubah?"
- **Client cache stale:** `fetchJsonCached` default staleTime 60 detik. Setelah create/update data, jika `clearJsonCache()` tidak dipanggil (atau dipanggil tapi URL tidak match), data lama masih tampil
- **Pusher event vs cache:** Event `absensi-updated` trigger `fetchDashboardData(true)` yang force refresh, tapi jika Pusher event datang terlambat atau gagal, dashboard tidak update

**Solusi:**
- **Idempotency key:** Tambahkan header `X-Idempotency-Key` di setiap POST/PUT request. Server cek apakah request dengan key yang sama sudah diproses → cegah double-submit
- **Optimistic locking:** Tambahkan kolom `updated_at` di tabel kritis. Saat update, cek apakah `updated_at` sama dengan yang terakhir di-read. Jika berbeda → data sudah diubah orang lain → tampilkan dialog "Data telah diubah oleh pengguna lain. Muat ulang?"
- **Debounce tombol submit:** Disable tombol submit segera setelah klik, re-enable hanya setelah response diterima. Tambahkan state `isSubmitting` yang konsisten
- **Cache invalidation yang lebih agresif:**
  - Setelah operasi write (POST/PUT/DELETE), **selalu** invalidate semua cache terkait organisasi tersebut
  - Gunakan pattern: `clearJsonCachePrefix('/api/dashboard')` bukan hanya remove per-key
  - Tambahkan `onMutate` callback di React Query untuk rollback data jika request gagal
- **Real-time sync indicator:** Tampilkan indicator "Data terakhir diperbarui: X detik lalu" di setiap halaman. Jika data stale > 60 detik, tampilkan tombol "Segarkan Data"

**File terkait:** `lib/client-cache.ts`, `lib/mem-cache.ts`, `AbsensiClient.tsx`, `KasClient.tsx`, `DashboardClient.tsx`

---

### Task 3: Validasi Data yang Tidak Ketat di Client-Side
**Masalah yang Ditemukan:**
- **Form anggota (`SiswaClient.tsx`):** Validasi nama hanya regex `^[a-zA-Z\s.'-]*$` di client, tapi di API (`api/siswa/route.ts`) regex berbeda: `^[a-zA-Z\s.'']*$` (single quote vs apostrophe berbeda). Data bisa ditolak server meski sudah lolos client
- **Form absensi:** Tidak ada validasi range untuk `uang_kas` — user bisa input Rp 99.999.999 atau bahkan angka negatif. API hanya validasi `min(0)` tapi tidak ada max
- **Form kas transaksi (`KasClient.tsx`):** Input nominal menggunakan string parsing manual (`replace(/\D/g, '')`) yang bisa overflow untuk angka sangat besar. API validasi `z.number().int()` tapi tidak ada batas atas
- **Form wawancara:** Validasi nama manual peserta (`saveManualPeserta`) dilakukan di client-side saja, tidak ada validasi unik — nama ganda bisa masuk
- **Import Excel:** Validasi format kolom bergantung pada pencocokan nama header (`matchKey`) yang fuzzy — header "Nama Siswa" atau "nama_siswa" bisa tidak terdeteksi

**Solusi:**
- **Shared validation schemas:** Buat Zod schema yang dipakai bersama di client DAN server:
  ```typescript
  // lib/shared-schemas.ts
  export const memberSchema = z.object({
    name: z.string().min(1).max(100).regex(/^[a-zA-Z\s.'-]+$/),
    nis: z.string().regex(/^\d{1,20}$/).nullable().optional(),
    email: z.string().email().nullable().optional(),
    class: z.string().max(30).nullable().optional(),
  })
  ```
- **Validasi nominal kas:**
  - Min: Rp 100 (cegah input Rp 0 atau Rp 1 yang tidak masuk akal)
  - Max: Rp 10.000.000 per transaksi (atau batas yang bisa dikonfigurasi)
  - Tampilkan peringatan jika nominal > Rp 500.000 (konfirmasi "Apakah nominal sudah benar?")
- **Validasi tanggal:**
  - Tidak bisa input absensi untuk tanggal masa depan
  - Peringatan jika input absensi untuk tanggal > 7 hari yang lalu
- **Pre-submit validation report:** Sebelum submit bulk data (import, absensi massal), tampilkan ringkasan validasi:
  ```
  ✅ 45 data valid
  ⚠️ 2 data dilewati (duplikat)
  ❌ 1 data error: "Budi Santoso" - nama mengandung angka
  ```

**File terkait:** Buat `lib/shared-schemas.ts`, `SiswaClient.tsx`, `AbsensiClient.tsx`, `KasClient.tsx`, `WawancaraClient.tsx`, `app/api/*/route.ts`

---

### Task 4: Data Tidak Ke-Load (Loading Failures)
**Masalah yang Ditemukan:**
- **`fetchJsonCached` tidak retry:** Jika request gagal (timeout, network error), data tidak dimuat ulang otomatis. User hanya lihat "Gagal memuat data" tanpa tombol retry
- **Dashboard 4 API calls:** Jika 1 dari 4 call gagal (misal charts timeout), seluruh section charts kosong tanpa indikasi error spesifik
- **`Promise.all` tanpa error handling:** Di `DashboardClient.tsx`, `Promise.all([stats, charts])` — jika salah satu gagal, keduanya tidak di-set. Seharusnya gunakan `Promise.allSettled`
- **Kas route `GET`:** Query ke `cash_transactions` bisa sangat lambat jika data ribuan baris tanpa index yang tepat → request timeout → data tidak tampil
- **Session expired tanpa redirect:** Jika session cookie expired saat fetch API, response 401 tidak ditangani — user stuck dengan data kosong tanpa tahu harus apa
- **`parseInt` tanpa NaN check:** Di banyak API route, `parseInt(req.headers.get('x-user-id') || '0')` bisa return 0 yang valid tapi bukan user ID yang sebenarnya

**Solusi:**
- **Retry mechanism:** Tambahkan retry otomatis di `fetchJsonCached`:
  - Network errors: retry 2x dengan exponential backoff (1s, 3s)
  - 5xx errors: retry 1x
  - 401/403: langsung redirect ke `/login`
- **Partial data loading:** Gunakan `Promise.allSettled` di DashboardClient:
  ```typescript
  const [statsResult, chartsResult] = await Promise.allSettled([
    fetchJsonCachedUrl('/api/dashboard?part=stats'),
    fetchJsonCachedUrl('/api/dashboard?part=charts'),
  ])
  if (statsResult.status === 'fulfilled') setStats(statsResult.value)
  if (chartsResult.status === 'rejected') setChartsError(chartsResult.reason)
  ```
- **Error boundary per section:** Setiap section (stat cards, charts, tabel, leaderboard) punya error boundary sendiri. Jika charts error, stat cards tetap tampil
- **Session timeout detection:**
  - Cek response status 401 di setiap fetch
  - Tampilkan modal "Sesi Anda telah berakhir" dengan tombol "Login Kembali"
  - Auto-redirect ke `/login` setelah 10 detik
- **Loading timeout:** Jika data tidak load dalam 15 detik, tampilkan:
  - Pesan "Koneksi lambat. Data masih dimuat..."
  - Tombol "Muat Ulang" dan "Lapor Masalah"
- **Database query optimization:**
  - Tambahkan index di kolom yang sering di-query: `attendance(organization_id, date)`, `cash_transactions(organization_id, type)`, `member(organization_id, status)`
  - Batasi query result dengan max limit (cegah query tanpa limit yang bisa return ribuan baris)

**File terkait:** `lib/client-cache.ts`, `DashboardClient.tsx`, semua `*Client.tsx`, `lib/prisma.ts`, buat `components/SectionErrorBoundary.tsx`

---

### Task 5: Data Tidak Masuk / Tidak Tersimpan
**Masalah yang Ditemukan:**
- **Form submit tanpa prevent double-click:** Di `SiswaClient.tsx`, `handleSave` tidak langsung disable tombol. User bisa klik 2x → 2 POST request → data ganda atau error unique constraint
- **Absensi bulk save:** `handleSave` di `AbsensiClient.tsx` mengirim 100+ row dalam 1 request. Jika request timeout (>30s), data tidak tersimpan tapi user tidak tahu. Tidak ada progress indicator
- **Import Excel besar:** File 1000+ baris diproses dalam 1 batch. Jika gagal di tengah, tidak ada data yang tersimpan (all or nothing). Tidak ada partial save
- **`req.json()` bisa gagal:** Jika body terlalu besar atau format salah, `req.json()` throw error tanpa catch di beberapa route
- **Header `x-user-id` hilang:** Di beberapa client call, header `x-user-id`, `x-user-nama`, `x-user-role` tidak dikirim → `getCtx()` return 0/empty → log aktivitas tidak mencatat siapa yang melakukan
- **Cash transaction `id: -1` placeholder:** Di `absensi/route.ts` line 178, ada `id: -1` sebagai placeholder untuk upsert yang pasti gagal di catch → fallback ke create. Ini tidak reliable dan bisa menyebabkan data ganda

**Solusi:**
- **Submit lock pattern:** Buat custom hook `useSubmitLock()`:
  ```typescript
  function useSubmitLock() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const submit = async (fn: () => Promise<void>) => {
      if (isSubmitting) return
      setIsSubmitting(true)
      try { await fn() } finally { setIsSubmitting(false) }
    }
    return { isSubmitting, submit }
  }
  ```
- **Chunked bulk save:** Untuk absensi 100+ row, bagi menjadi batch 25 row:
  - Tampilkan progress: "Menyimpan batch 1/4... (25/100)"
  - Jika batch 3 gagal, batch 1-2 sudah tersimpan. Tampilkan: "75 berhasil, 25 gagal"
  - Tambahkan opsi "Coba Lagi" hanya untuk batch yang gagal
- **Import Excel progress:**
  - Validasi SEMUA baris sebelum insert (pre-flight check)
  - Tampilkan preview: "45 data valid, 2 duplikat, 1 error"
  - Proses dalam batch 50 row dengan progress bar
  - Jika gagal, data yang sudah masuk tetap tersimpan (partial save)
  - Tampilkan laporan: "Berhasil import 45 dari 48 data. 2 duplikat dilewati, 1 error: baris 23 nama kosong"
- **Wajibkan header user di semua request:** Buat fetch wrapper yang otomatis inject header dari session:
  ```typescript
  async function apiFetch(url: string, options: RequestInit = {}) {
    const session = await getSession()
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'x-user-id': session.id.toString(),
        'x-user-nama': session.nama,
        'x-user-role': session.role,
        'x-active-org-id': session.activeOrgId?.toString() || '',
      }
    })
  }
  ```
- **Perbaiki cashTransaction upsert:** Ganti `id: -1` placeholder dengan unique constraint yang benar:
  - Buat composite unique: `(organization_id, member_id, date)` untuk attendance-based kas
  - Atau gunakan `create` langsung tanpa upsert jika memang selalu create baru

**File terkait:** `AbsensiClient.tsx`, `SiswaClient.tsx`, `DashboardClient.tsx`, `app/api/absensi/route.ts`, buat `lib/use-submit-lock.ts`, buat `lib/api-fetch.ts`

---

### Task 6: Input Sanitasi & Keamanan Data
**Masalah yang Ditemukan:**
- **XSS via nama/keterangan:** Data nama dan keterangan disimpan apa adanya dan di-render sebagai HTML text. Meski React auto-escape, jika data di-export ke Excel/HTML report, bisa mengandung formula injection (`=CMD|'/C calc'!A0`)
- **SQL injection di raw query:** `app/api/dashboard/route.ts` menggunakan `$queryRawUnsafe` untuk attendance chart. Meski parameter sudah di-escape, pattern ini berisiko
- **File upload tanpa validasi tipe:** Import Excel menerima file berdasarkan extension, tapi tidak validasi MIME type atau konten file. File `.xlsx` palsu bisa mengandung macro berbahaya
- **Password di localStorage:** `login/page.tsx` menyimpan password di `localStorage` untuk auto-fill. Ini sangat tidak aman — password bisa dicuri via XSS

**Solusi:**
- **Sanitasi semua input:**
  ```typescript
  function sanitizeInput(input: string): string {
    return input
      .replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]!))
      .trim()
  }
  ```
- **Hapus password dari localStorage:**
  - Ganti dengan auto-fill via credential management API atau biometric
  - Atau minimal, hash password sebelum simpan (meski bukan best practice)
  - Tambahkan warning: "Menyimpan password di browser tidak disarankan"
- **Validasi file upload:**
  - Cek MIME type: hanya `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` dan `text/csv`
  - Cek ukuran max: 5MB
  - Parse file di server dengan library terpercaya, jangan eval/exec konten file
- **Ganti `$queryRawUnsafe`:** Gunakan parameterized query saja:
  ```typescript
  // SEBELUM (berisiko):
  prisma.$queryRawUnsafe(`SELECT ... WHERE org_id = ANY($1::int[])`, start7, `{${ids}}`)
  // SESUDAH (aman):
  prisma.$queryRaw`SELECT ... WHERE org_id = ANY(${ids}::int[])`
  ```
- **Export sanitization:** Saat export ke Excel, prefix cell yang mengandung `=`, `+`, `-`, `@` dengan single quote untuk cegah formula injection

**File terkait:** `app/login/page.tsx`, `app/api/dashboard/route.ts`, `app/api/import-excel/route.ts`, `app/api/export/route.ts`, buat `lib/sanitize.ts`

---

## 🟡 Prioritas P1 — Tinggi

### Task 7: Data Ganda & Duplikasi
**Masalah yang Ditemukan:**
- **Duplikat anggota:** `POST /api/siswa` cek duplikat by name (case-insensitive) di organisasi yang sama. Tapi:
  - Tidak cek duplikat NIS — 1 siswa bisa masuk 2x dengan NIS sama tapi nama sedikit berbeda
  - Import Excel cek duplikat nama, tapi jika nama di Excel berbeda spasi ("Budi  Santoso" vs "Budi Santoso"), tidak terdeteksi
- **Duplikat absensi:** Upsert by `member_id_date` unique constraint. Tapi jika timezone server berbeda dengan timezone lokal, `new Date(tanggal)` bisa masuk ke tanggal berbeda → absensi masuk ke hari yang salah
- **Duplikat kas transaksi:** Tidak ada unique constraint di `cash_transactions` — klik 2x → 2 transaksi tercatat. Tidak ada mekanisme undo
- **Duplikat wawancara:** QR scan bisa menghasilkan duplikat antrian jika peserta scan 2x (meski sudah ada validasi token)

**Solusi:**
- **Normalisasi data sebelum validasi:**
  ```typescript
  function normalizeName(name: string) {
    return name.trim().replace(/\s+/g, ' ').toLowerCase()
  }
  ```
- **Validasi NIS unik global:** Tambahkan check NIS unik di level database (unique constraint di Prisma schema)
- **Absensi timezone fix:**
  - Gunakan string tanggal langsung (`'2026-06-18'`) tanpa konversi `new Date()` yang bisa bergeser timezone
  - Atau gunakan `date-only` type di database (tanpa time component)
- **Kas anti-duplikat:**
  - Tambahkan validasi: jika ada transaksi dengan member + nominal + keterangan yang sama dalam rentang 5 menit → tampilkan peringatan "Transaksi serupa sudah ada. Yakin ingin menambah lagi?"
  - Tambahkan fitur undo: setelah transaksi, tampilkan toast "Transaksi berhasil" dengan tombol "Batalkan" selama 10 detik
- **Dashboard data integrity check:**
  - Tambahkan validasi: total pemasukan - total pengeluaran = total kas. Jika tidak match → tampilkan warning "Ada ketidaksesuaian data kas"
  - Tambahkan endpoint `/api/integrity-check` yang admin bisa jalankan untuk audit data

**File terkait:** `app/api/siswa/route.ts`, `app/api/absensi/route.ts`, `app/api/kas/transaksi/route.ts`, `prisma/schema.prisma`

---

### Task 8: Cache Invalidation yang Tidak Reliable
**Masalah yang Ditemukan:**
- **`clearJsonCache()` tanpa parameter** di `AbsensiClient.tsx` dan `KasClient.tsx` menghapus SEMUA cache — termasuk cache yang tidak terkait. Ini boros tapi juga bisa menyebabkan race condition: cache dihapus → request baru masuk → data lama dari request sebelumnya masih di-flight
- **Cache key tidak konsisten:** Di `DashboardClient.tsx`, cache di-clear per part (`/api/dashboard?part=stats`), tapi URL yang di-cache bisa berbeda format (`/api/dashboard?part=stats` vs `/api/dashboard?part=all`)
- **Server-side cache (`mem-cache.ts`):** TTL 30 detik untuk stats, 120 detik untuk charts. Setelah write operation, server cache tidak di-invalidate → dashboard menampilkan data lama sampai TTL expired
- **`clientQueryClient.removeQueries`** hanya remove dari React Query cache, tapi browser HTTP cache (jika ada) bisa masih menyimpan response lama

**Solusi:**
- **Unified cache invalidation:**
  ```typescript
  function invalidateAllRelatedData(orgId: number) {
    // Client cache
    clearJsonCachePrefix('/api/dashboard')
    clearJsonCachePrefix('/api/siswa')
    clearJsonCachePrefix('/api/absensi')
    clearJsonCachePrefix('/api/kas')
    // Server cache
    serverCacheInvalidate(`dashboard:*:${orgId}:*`)
  }
  ```
- **Cache versioning:** Tambahkan version number di cache key. Setiap write operation increment version:
  ```
  dashboard:stats:v3:administrator:5:2026-06-18
  ```
- **Force no-cache setelah write:** Semua POST/PUT/DELETE request harus menggunakan `cache: 'no-store'` di client
- **ETag / Last-Modified:** Tambahkan header ETag di API response. Client kirim `If-None-Match` → server return 304 jika data tidak berubah
- **Cache status indicator:** Tampilkan di UI kapan data terakhir di-refresh:
  ```
  🔄 Data diperbarui 5 detik lalu | Terakhir: 14:32:05
  ```

**File terkait:** `lib/client-cache.ts`, `lib/mem-cache.ts`, `lib/api-cache.ts`, semua `*Client.tsx`

---

### Task 9: Timeout & Large Data Handling
**Masalah yang Ditemukan:**
- **Import 1000+ baris Excel:** Diproses synchronous dalam 1 request. Default Next.js API timeout 30 detik → bisa timeout untuk file besar
- **Export wawancara:** Query semua data tanpa limit → bisa timeout jika ribuan baris
- **Dashboard charts:** 6 query `kasPerBulan` dijalankan sequential (1 per bulan) → 6x round-trip ke database
- **Tabel tanpa virtual scroll:** `SiswaClient.tsx` load 15 row per page. Jika user scroll cepat, setiap page butuh 1 request. Tidak ada infinite scroll atau virtual scroll
- **Absensi 100+ row:** Semua row di-render sekaligus di DOM. Di mobile, ini bisa freeze browser

**Solusi:**
- **Background job untuk import besar:**
  - Untuk import > 100 baris, gunakan background processing
  - Client poll status: "Memproses... 45/200 (22.5%)"
  - Tampilkan notifikasi saat selesai
- **Streaming export:** Gunakan streaming response untuk export data besar
- **Dashboard charts optimization:** Gabungkan 6 query bulanan menjadi 1 query dengan `GROUP BY DATE_TRUNC('month', created_at)`
- **Virtual scroll untuk tabel besar:**
  - Gunakan `@tanstack/react-virtual` untuk tabel > 50 row
  - Atau infinite scroll dengan intersection observer
- **Pagination yang lebih baik:**
  - Tambahkan "Go to page" input untuk tabel dengan banyak halaman
  - Tampilkan total halaman dan current range: "Menampilkan 1-15 dari 342 data"
  - Allow change page size: 15 / 30 / 50 / 100 per halaman

**File terkait:** `app/api/import/route.ts`, `app/api/dashboard/route.ts`, `SiswaClient.tsx`, `AbsensiClient.tsx`, `app/api/wawancara/export/route.ts`

---

## 🟢 Prioritas P2 — Sedang

### Task 10: Audit Trail & Data Recovery
**Masalah yang Ditemukan:**
- **Log aktivitas tidak lengkap:** Beberapa API route tidak mencatat log saat create/update/delete. Contoh: `kas/transaksi` mencatat log, tapi detail `dataBaru` tidak diisi
- **Tidak ada soft delete:** Semua delete bersifat permanent. Jika admin tidak sengaja hapus anggota, data hilang selamanya
- **Tidak ada backup/restore UI:** Ada endpoint `/api/admin/backup` tapi tidak ada UI untuk restore. Admin hanya bisa download SQL dump
- **Tidak ada change history:** User tidak bisa melihat riwayat perubahan data anggota (siapa yang mengubah, kapan, dari nilai apa ke nilai apa)

**Solusi:**
- **Soft delete pattern:**
  - Tambahkan kolom `deleted_at` di tabel kritis (member, attendance, cash_transactions)
  - Semua DELETE menjadi update `deleted_at = now()`
  - Tambahkan halaman "Sampah" (Trash) untuk restore data yang dihapus dalam 30 hari terakhir
  - Auto-hard-delete setelah 30 hari via cron job
- **Change history:**
  - Tambahkan tabel `data_changes` yang mencatat:
    - tabel, record_id, field, old_value, new_value, changed_by, changed_at
  - Tampilkan riwayat perubahan di detail anggota
- **Backup UI:**
  - Tambahkan halaman Backup & Restore dengan:
    - Tombol "Backup Sekarang" (download SQL dump)
    - Upload file backup untuk restore
    - Jadwal backup otomatis (harian/mingguan)
    - List backup terakhir dengan tanggal dan ukuran
- **Data integrity monitoring:**
  - Cron job harian yang cek:
    - Total kas di dashboard vs total di cash_transactions
    - Jumlah absensi hari ini vs jumlah XP yang diberikan
    - Orphan records (attendance tanpa member, cash_transactions tanpa member)
  - Tampilkan warning di dashboard jika ada anomali

**File terkait:** `prisma/schema.prisma`, buat `app/api/trash/route.ts`, buat `app/trash/page.tsx`, `app/api/admin/backup/route.ts`, `lib/log.ts`

---

## 📊 Ringkasan Prioritas

| No | Task | Dampak | Effort | Prioritas |
|----|------|--------|--------|-----------|
| 1 | Error API Tidak Konsisten | 🔴 Kritis | 🟡 Sedang | **P0** |
| 2 | Race Condition & Data Tidak Update | 🔴 Kritis | 🔴 Tinggi | **P0** |
| 3 | Validasi Client-Side Tidak Ketat | 🔴 Kritis | 🟡 Sedang | **P0** |
| 4 | Data Tidak Ke-Load | 🔴 Kritis | 🟡 Sedang | **P0** |
| 5 | Data Tidak Masuk / Tidak Tersimpan | 🔴 Kritis | 🟡 Sedang | **P0** |
| 6 | Input Sanitasi & Keamanan | 🔴 Kritis | 🟡 Sedang | **P0** |
| 7 | Data Ganda & Duplikasi | 🟡 Tinggi | 🟡 Sedang | **P1** |
| 8 | Cache Invalidation Tidak Reliable | 🟡 Tinggi | 🟡 Sedang | **P1** |
| 9 | Timeout & Large Data | 🟡 Tinggi | 🔴 Tinggi | **P1** |
| 10 | Audit Trail & Data Recovery | 🟡 Sedang | 🔴 Tinggi | **P2** |

---

## 🚀 Urutan Implementasi

**Sprint 0 (Data Integrity — SEGERA, 3-5 hari):**
- Task 6: Hapus password dari localStorage (KEAMANAN KRITIS)
- Task 1: Standarisasi error handling API
- Task 3: Shared validation schemas (client + server)
- Task 5: Submit lock + header injection
- Task 4: Promise.allSettled + retry mechanism

**Sprint 1 (Data Reliability — 3-5 hari):**
- Task 2: Idempotency key + optimistic locking
- Task 8: Unified cache invalidation
- Task 9: Chunked bulk save + import progress

**Sprint 2 (Anti-Duplikat & Optimasi — 3-5 hari):**
- Task 7: Normalisasi data + anti duplikat
- Task 9: Dashboard charts optimization + virtual scroll

**Sprint 3 (Data Management — 5-7 hari):**
- Task 10: Soft delete + trash + change history
- Backup & restore UI
- Data integrity monitoring

---

## 📁 File Baru yang Perlu Dibuat

| File | Fungsi |
|------|--------|
| `lib/api-client.ts` | Fetch wrapper dengan retry, error parsing, auto header injection |
| `lib/shared-schemas.ts` | Zod schemas yang dipakai bersama client & server |
| `lib/sanitize.ts` | Fungsi sanitasi input (XSS, formula injection) |
| `lib/use-submit-lock.ts` | Custom hook untuk mencegah double-submit |
| `lib/api-error.ts` | Class error terstruktur dengan code & field |
| `components/SectionErrorBoundary.tsx` | Error boundary per section di dashboard |
| `app/api/trash/route.ts` | API untuk restore soft-deleted data |
| `app/trash/page.tsx` | Halaman "Sampah" untuk restore data |
| `app/api/integrity-check/route.ts` | API untuk audit integritas data |

---

*Planning Backend & Integritas Data — Artemis Series v20.6.12 Pro Series*
*Dibuat: 18 Juni 2026*
