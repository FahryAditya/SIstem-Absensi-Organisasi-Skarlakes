# Rencana Perbaikan Keamanan & Optimalisasi Infrastruktur

Dokumen ini menguraikan rencana perbaikan untuk mengatasi kerentanan keamanan dan optimasi infrastruktur pada sistem.

## 1. Masalah Teridentifikasi
- **Keamanan:**
    - Penggunaan *plain-text password* pada `app/api/auth/login/route.ts`.
    - Validasi identitas yang lemah (*case-insensitive match*).
    - Kurangnya proteksi terhadap serangan *brute-force* (Rate Limiting).
    - Potensi *missing security headers* pada respon API.
- **Infrastruktur & Database (Neon/Supabase):**
    - *Connection pool limit* terlalu rendah (bottleneck).
    - *Schema drift* akibat bypass migrasi resmi.
    - Kurangnya optimalisasi query untuk lingkungan *serverless/cloud* (Neon/Supabase).

## 2. Tujuan Perbaikan
1. Mengamankan autentikasi (Hashing password).
2. Mencegah serangan *brute-force* dan *abuse* API.
3. Meningkatkan performa dan stabilitas database (Neon/Supabase).

## 3. Rencana Aksi

### A. Keamanan (Security Hardening)
- [ ] **Autentikasi:** Implementasi `bcrypt` untuk hashing password.
- [ ] **Rate Limiting:** Implementasi *middleware* atau *library* untuk membatasi *request* per IP pada endpoint sensitif (login, register).
- [ ] **Security Headers:** Konfigurasi *headers* (CSP, HSTS, X-Content-Type-Options) di `next.config.js` atau `middleware.ts`.

### B. Optimalisasi Database (Neon/Supabase)
- [ ] **Connection Pooling:** 
    - Konfigurasi `pool_timeout`, `connection_limit` yang disesuaikan dengan *tier* database (Neon Connection Pooler).
- [ ] **Query Performance:** 
    - Analisis *slow queries* (menggunakan *database logs*).
    - Penambahan *indexing* pada kolom yang sering dicari.
- [ ] **Migrasi:** Sinkronisasi skema manual ke *Prisma migrations* resmi.

## 4. Rencana Kerja (Langkah demi Langkah)

### Tahap 1: Persiapan & Audit
- [ ] Audit `package.json` untuk *dependencies* (bcrypt, rate-limiters).
- [ ] Review konfigurasi `lib/prisma.ts` untuk parameter koneksi Neon.

### Tahap 2: Implementasi
- [ ] Terapkan Hashing Password & migrasi data pengguna.
- [ ] Terapkan *Rate Limiting* global dan *endpoint-specific*.
- [ ] Sesuaikan konfigurasi `PrismaClient` untuk memanfaatkan *Neon connection pooling* dengan optimal.

### Tahap 3: Verifikasi
- [ ] Uji performa *load* (terutama setelah optimasi koneksi).
- [ ] Verifikasi proteksi *brute-force* (test limit).

## 5. Catatan Penting
- Gunakan `process.env` untuk semua kredensial database dan *salt/secret keys*.
- Prioritaskan koneksi melalui *connection pooler* (URL `postgres://...` yang berbeda untuk pooling) di Neon.
