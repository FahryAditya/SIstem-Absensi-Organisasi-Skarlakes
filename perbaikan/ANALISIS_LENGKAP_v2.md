# ANALISIS LENGKAP V2 - SISTEM EKSTRAKURIKULER

**Tanggal:** 2 Juli 2026  
**Project:** Ekskul Dashboard v2 (Next.js 14.2.5 + Prisma + PostgreSQL)  
**Status:** WARNING (✅), UI/UX (✅), DATA (✅ sebagian) sudah diperbaiki

---

## DAFTAR ISI

1. [🔴 KRITIS - Security](#1-kritis-security)
2. [🔴 KRITIS - Bug Fatal](#2-kritis-bug-fatal)
3. [🟠 SEDANG - Security & Auth](#3-sedang-security--auth)
4. [🟠 SEDANG - Code Quality](#4-sedang-code-quality)
5. [🟡 WARNING - Tersisa](#5-warning-tersisa)
6. [📊 DATA - Arsitektural](#6-data-arsitektural)
7. [📁 Infrastruktur & Konfigurasi](#7-infrastruktur--konfigurasi)
8. [Rekomendasi Prioritas](#8-rekomendasi-prioritas)

---

## 1. 🔴 KRITIS - Security

### 1.1 `.env` Files Berisi Live Credentials Terexpose di Git

| **Lokasi** | `.env`, `.env.local`, `.env.vps` |
|---|---|
| **Dampak** | Database URL, Cloudinary API Secret, Gmail App Password, Supabase keys, Vercel OIDC token — semua terexpose di repository |
| **Isi** | `DATABASE_URL` dengan password `npg_VJlPSeMKa8X7`, `CLOUDINARY_API_SECRET`, `GMAIL_APP_PASSWORD`, `VERCEL_OIDC_TOKEN` (JWT), dll |
| **Perbaikan** | Segera rotate semua secret. Hapus file .env dari git tracking dengan `git rm --cached` dan tambah ke `.gitignore` |

### 1.2 Password Tersimpan di localStorage

| **Lokasi** | `app/login/page.tsx:49` |
|---|---|
| **Kode** | `localStorage.setItem('last_login', JSON.stringify({ nama, email, password }))` |
| **Dampak** | Password user tersimpan di browser dalam plaintext. Bisa dicuri oleh XSS, ekstensi, atau pengguna lain di komputer bersama |
| **Perbaikan** | Hapus penyimpanan password. Simpan hanya `nama` dan `email` untuk auto-fill, atau hapus fitur remember login |

### 1.3 Weak/Overridable JWT Secret

| **Lokasi** | `.env:43`, `.env.vps:12,15`, `scratch/test_api.ts:3` |
|---|---|
| **Dampak** | JWT secret masih menggunakan placeholder (`ganti-dengan-secret-anda...`). Dua nilai di `.env.vps` (satu timpa yang lain). Hardcoded di file scratch |
| **Perbaikan** | Generate secret kuat: `openssl rand -base64 64`. Hapus file scratch dari repo |

### 1.4 Endpoint Upload Foto Tanpa Autentikasi

| **Lokasi** | `app/api/documentation/upload-photo/route.ts` |
|---|---|
| **Dampak** | Siapa pun bisa upload file ke Cloudinary tanpa login. Hanya divalidasi tipe/ukuran file saja |
| **Perbaikan** | Tambah session check + RBAC sebelum proses upload |

### 1.5 Endpoint Backup Hanya Cek Header

| **Lokasi** | `app/api/admin/backup/route.ts:38-42` |
|---|---|
| **Kode** | `const userRole = reqHeaders.get('x-user-role')` — hanya cek header, tanpa verifikasi session |
| **Dampak** | Jika middleware bypass, attacker bisa download FULL database (semua user, anggota, transaksi) |
| **Perbaikan** | Gunakan `getSessionFromRequest()` untuk verifikasi independen |

---

## 2. 🔴 KRITIS - Bug Fatal

### 2.1 IDOR - 6 Endpoint Slugs Bisa Diakses Siapa Pun

| **Endpoint** | **Method** | **Masalah** |
|---|---|---|
| `organizations/[slug]/members` | GET | Tidak ada pengecekan akses organisasi |
| `organizations/[slug]/admins` | GET | Tidak ada pengecekan akses organisasi |
| `organizations/[slug]/cash` | GET | Tidak ada pengecekan akses organisasi |
| `organizations/[slug]/attendance` | GET | Tidak ada pengecekan akses organisasi |
| `documentation/[id]` | GET | Tidak ada pengecekan akses |
| `documentation` | GET | Tidak ada pengecekan akses |

| **Dampak** | User mana pun bisa lihat data organisasi lain dengan menebak slug |

### 2.2 `isSuperAdmin()` di `kas/transactions` Termasuk `admin_osis_mpk`

| **Lokasi** | `app/api/kas/transactions/route.ts:16-18` |
|---|---|
| **Kode** | `role === 'SUPER_ADMIN' || role === 'administrator' || role === 'admin_osis_mpk'` |
| **Dampak** | `admin_osis_mpk` bukan super admin. Memberi akses berlebih ke role yang salah |
| **Perbaikan** | Hapus `admin_osis_mpk` dari fungsi `isSuperAdmin` di file itu |

### 2.3 29 Route Files Tidak Punya try/catch

| **Dampak** | Unhandled promise rejection akan crash route. Return stack trace di development |

**File tanpa try/catch di SATU ATAU LEBIH handler:**
- `absensi/route.ts` — GET, POST
- `wawancara/route.ts` — GET, POST, PUT
- `wawancara/qr/route.ts` — GET, POST, DELETE
- `wawancara/public/route.ts` — GET
- `wawancara/override/route.ts` — POST
- `wawancara/hasil/route.ts` — POST
- `wawancara/export/route.ts` — GET
- `wawancara/chat/route.ts` — GET, POST
- `wawancara/antrian/route.ts` — POST, PATCH, DELETE
- `wawancara/antrian/[id]/route.ts` — DELETE
- `users/route.ts` — GET, POST, PUT
- `siswa/route.ts` — GET, POST, PUT, DELETE
- `siswa/xp/route.ts` — POST (hanya inner yang punya try)
- `admin/reveal-password/route.ts` — POST
- `dashboard/route.ts` — GET
- `system-update/route.ts` — GET, POST, DELETE
- `system-update/seen/route.ts` — POST
- `kas/transaksi/route.ts` — GET
- `registration/route.ts` — GET
- `auth/me/route.ts` — GET
- `auth/logout/route.ts` — POST
- `log/route.ts` — GET
- `organisasi/absensi/route.ts` — GET, POST
- `materi/route.ts` — GET, DELETE
- `jadwal/route.ts` — GET, DELETE
- `pencapaian/route.ts` — GET, DELETE
- `pencapaian/berikan/route.ts` — GET
- `admin/optimize/route.ts` — POST (auth check di luar try)
- `health/route.ts` — GET (minimal, low risk)

### 2.4 22 Route Files Tidak Punya Validasi Zod

| **Dampak** | Request body/query tidak divalidasi — SQL injection, type confusion, data korup |

**File tanpa Zod di endpoint yang menerima input:**
- `admin/email-setting/route.ts` — POST
- `admin/reveal-password/route.ts` — POST
- `admin/school-year/rollback/route.ts` — POST
- `admin/school-year/progression/route.ts` — POST
- `admin/registration/action/route.ts` — PATCH
- `admin/optimize/route.ts` — POST
- `wawancara/qr/route.ts` — POST
- `email/send/route.ts` — POST
- `system-update/seen/route.ts` — POST
- `system-update/route.ts` — POST
- `kegiatan/route.ts` — POST
- `kegiatan/[id]/pengelompokan/route.ts` — POST
- `dokumentasi/route.ts` — POST
- `documentation/[id]/route.ts` — PUT
- `documentation/create/route.ts` — POST
- `documentation/upload-photo/route.ts` — POST
- `organizations/route.ts` — POST, PUT
- `organizations/[slug]/members/route.ts` — POST
- `organizations/[slug]/attendance/route.ts` — POST
- `organizations/[slug]/admins/route.ts` — POST
- `import-excel/route.ts` — POST
- `members/import-excel/route.ts` — POST

### 2.5 DUPLIKASI: Gamification Logic di 2 File Berbeda

| **Lokasi** | `lib/gamification.ts` vs `lib/exp.ts` |
|---|---|
| **Dampak** | Kedua file definisikan `LEVEL_THRESHOLDS` dan logika EXP/level. `gamification.ts` punya `EXP_PER_LEVEL` manual, `exp.ts` hitung dinamis. Beda implementasi = beda hasil level |
| **Perbaikan** | Hapus `lib/gamification.ts`, gunakan `lib/exp.ts` sebagai single source of truth |

### 2.6 `lib/email.ts` Hanya Stub

| **Lokasi** | `lib/email.ts` vs `lib/services/gmail.service.ts` |
|---|---|
| **Dampak** | Email gamification (level up, pencapaian) menggunakan `lib/email.ts` yang cuma `console.log`. Email tidak pernah terkirim di production. Hanya email admin via `email/send` yang menggunakan transport real |
| **Perbaikan** | Route semua pengiriman email melalui `gmail.service.ts`. Hapus stub |

---

## 3. 🟠 SEDANG - Security & Auth

### 3.1 Header-Based Auth Dapat Dispoof (11+ Route)

| **Lokasi** | `dokumentasi/route.ts`, `absensi/route.ts`, `pengeluaran/route.ts`, `materi/route.ts`, `siswa/route.ts`, `users/route.ts`, `wawancara/antrian/route.ts`, `documentation/[id]/route.ts`, `documentation/create/route.ts`, `admin/optimize/route.ts`, `admin/backup/route.ts` |
|---|---|
| **Pola** | `req.headers.get('x-user-id')`, `req.headers.get('x-user-role')` |
| **Dampak** | Jika middleware bypass (contoh: URL dengan titik di `middleware.ts`), header bisa dimanipulasi langsung oleh client |
| **Perbaikan** | Tambah `getSessionFromRequest()` sebagai verifikasi independen |

### 3.2 Endpoint Registrasi Publik Tanpa Rate Limit

| **Lokasi** | `registration/route.ts`, `registration/osis-mpk/route.ts`, `registration/eskul/route.ts` |
|---|---|
| **Dampak** | Tidak ada CAPTCHA, rate limit, atau anti-spam. Bisa diserang registrasi massal |
| **Perbaikan** | Implement rate limit (sudah ada `lib/rate-limit.ts`) atau minimal validasi origin |

### 3.3 No CSRF Protection

| **Lokasi** | Semua endpoint state-changing (POST/PUT/PATCH/DELETE) |
|---|---|
| **Dampak** | Jika user login dan mengunjungi situs jahat, request bisa dibuat tanpa sepengetahuan user |
| **Perbaikan** | Validasi `Origin`/`Referer` header di semua state-changing endpoints, atau implement CSRF token |

### 3.4 `dangerouslySetInnerHTML` di Layout

| **Lokasi** | `app/layout.tsx:109` |
|---|---|
| **Dampak** | Untuk JSON-LD (SEO). Saat ini aman karena data hardcoded. Jika data mengandung user input, jadi XSS |
| **Perbaikan** | Tambah sanitasi atau generate tanpa `dangerouslySetInnerHTML` |

### 3.5 Password Hardcoded di Scratch Files

| **Lokasi** | `scratch/create_admin.ts:12`, `scratch/create_admin_supabase.ts:22` |
|---|---|
| **Isi** | Password `'AdministratorFahry'` hardcoded |
| **Dampak** | Terexpose di git. Siapa pun bisa lihat password ini |
| **Perbaikan** | Hapus file scratch dari repo (`git rm`) |

---

## 4. 🟠 SEDANG - Code Quality

### 4.1 92+ `as any` Type Assertions di 26 Route Files

| **Dampak** | Membypass TypeScript type safety. Error runtime baru ketahuan setelah production |

**File dengan `as any` terbanyak:**
- `reports/route.ts` — 12+
- `pengeluaran/route.ts` — 9+
- `pencapaian/award/route.ts` — 8+
- `materi/route.ts` — 8+
- `organisasi/absensi/route.ts` — 7+
- `wawancara/route.ts` — 7+
- `pencapaian/route.ts` — 6+
- Lainnya: 19 file

### 4.2 Raw SQL Queries (2 File)

| **Lokasi** | `dokumentasi/route.ts` ($executeRawUnsafe), `admin/optimize/route.ts` ($queryRawUnsafe + $executeRawUnsafe) |
|---|---|
| **Dampak** | Jika ada string interpolation tanpa validasi, jadi SQL injection |

### 4.3 `console.log` di Production Routes

| **Lokasi** | `cron/jadwal-reminder/route.ts:88`, `registration/route.ts:60`, `registration/osis-mpk/route.ts:62`, `registration/eskul/route.ts:62` |
|---|---|
| **Dampak** | Informasi registrasi user bisa terexpose di log server |

### 4.4 Duplicate Route: `transactions` vs `transaksi`

| **Lokasi** | `app/api/kas/transactions/route.ts` vs `app/api/kas/transaksi/route.ts` |
|---|---|
| **Dampak** | Dua endpoint untuk fungsi yang sama (Inggris vs Indonesia). Bisa inkonsisten |
| **Perbaikan** | Hapus salah satu, redirect ke yang standar |

---

## 5. 🟡 WARNING - Tersisa

### 5.1 Tidak Ada `@/hooks` Directory

| **Lokasi** | `components.json` mendefinisikan `"hooks": "@/hooks"` |
|---|---|
| **Dampak** | Import `@/hooks/*` akan gagal — direktori tidak ada |
| **Perbaikan** | Buat direktori `hooks/` atau hapus alias dari `components.json` |

### 5.2 In-Memory Rate Limit (3.6)

| **Lokasi** | `lib/rate-limit.ts:8` — `new Map()` |
|---|---|
| **Dampak** | Per-instance. Di horizontal scaling, tiap instance punya counter sendiri |
| **Perbaikan** | Gunakan database atau Redis |

### 5.3 Sliding Token Refresh Tanpa Max Lifetime (2.17)

| **Lokasi** | `lib/auth.ts:37-47, 78-86` |
|---|---|
| **Dampak** | Token bisa diperpanjang terus setiap 2 jam |
| **Perbaikan** | Tambah absolute max session lifetime |

### 5.4 Root Page Tidak Ada (Redirect Langsung)

| **Lokasi** | `app/page.tsx` |
|---|---|
| **Dampak** | Kemungkinan langsung redirect ke `/login` atau `/dashboard`. Tidak jelas tanpa baca kode |

---

## 6. 📊 DATA - Arsitektural

### 6.1 Role Enum Overlap (5.1)

| **Status** | ⏳ Perlu refactor besar |
|---|---|
| **Masalah** | 7 nilai role: `administrator` = `SUPER_ADMIN`, `organization_admin` = `ORG_ADMIN`, plus 3 role spesifik organisasi |
| **Saran** | Simplifikasi jadi 3: `SUPER_ADMIN`, `ORG_ADMIN`, + `OrganisasiType` sebagai discriminator |

### 6.2 String Fields Harusnya Enum (5.2)

| **Status** | ⏳ Perlu migrasi DB |
|---|---|
| **Field** | `SesiWawancara.status`, `AntrianWawancara.status/ip_status/status_validasi`, `HasilWawancara.keterangan/hasil`, `Absensi.status`, `AbsensiOrganisasi.status` |

### 6.3 Merge Siswa/AnggotaOsis/AnggotaMpk (5.5)

| **Status** | ⏳ Perlu refactor besar |
|---|---|
| **Masalah** | 3 model dengan struktur identik (nis, nama, kelas, status, dll) |
| **Saran** | 1 model `Member` dengan discriminator |

### 6.4 Duplikasi Model `Pencapaian` vs `Achievement`

| **Status** | ⏳ Perlu migrasi |
|---|---|
| **Masalah** | `Pencapaian` (legacy, no relations) dan `Achievement` (proper, with MemberAchievement join) adalah duplikasi |
| **Saran** | Migrasi semua data dari `Pencapaian` ke `Achievement`, hapus model `Pencapaian` |

---

## 7. 📁 Infrastruktur & Konfigurasi

### 7.1 `.gitignore` Bermasalah

| **Masalah** | `prisma/migrations/` ada di `.gitignore` TAPI migrations sudah ditrack git. Pola `prisma/migrations/` akan exclude migrations baru |
|---|---|
| **Perbaikan** | Hapus pola `prisma/migrations/` dari `.gitignore` karena migrations HARUS di-version control |

### 7.2 Build Error History

| **Lokasi** | `build_errors.txt` |
|---|---|
| **Isi** | Error `dateTaken does not exist on type...` di `documentation/[id]/route.ts` (sudah diperbaiki) |

---

## 8. Rekomendasi Prioritas

### 🔴 IMMEDIATE (24 jam)

1. **Rotate semua secret** — DB password, Cloudinary, Gmail, Supabase, JWT secret
2. **Hapus .env files dari git** — `git rm --cached .env .env.local .env.vps`, tambah ke `.gitignore`
3. **Hapus scratch files dari repo** — `git rm -r scratch/`
4. **Hapus penyimpanan password di localStorage** — `app/login/page.tsx:49`
5. **Tambah autentikasi ke upload-photo endpoint** — `documentation/upload-photo/route.ts`
6. **Fix isSuperAdmin di kas/transactions** — Hapus `admin_osis_mpk`

### 🔴 HIGH (1-3 hari)

7. **Fix IDOR di 6 endpoint** — Tambah pengecekan akses organisasi
8. **Tambah try/catch ke 29 route files**
9. **Tambah Zod validation ke 22 route files**
10. **Fix backup endpoint** — Gunakan `getSessionFromRequest()`
11. **Konsolidasi gamification logic** — Hapus `lib/gamification.ts`

### 🟠 MEDIUM (1 minggu)

12. **Konsolidasi email system** — Route semua via `gmail.service.ts`
13. **Tambahkan rate limit ke endpoint publik** (registrasi)
14. **Fix header-based auth** — Tambah verifikasi session independen
15. **Konsolidasi `kas/transactions` vs `kas/transaksi`**

### 🟡 LOW (2+ minggu)

16. **Buat direktori `hooks/`**
17. **Tambahkan absolute max session lifetime**
18. **Migrasi DB untuk enum fields**
19. **Perbaiki role enum overlap**

---

## RINGKASAN

| **Kategori** | **Jumlah** | **Severity** |
|---|---|---|
| 🔴 KRITIS — Security | 5 issues | Live credentials exposed, password in localStorage, weak JWT, unprotected upload, unprotected backup |
| 🔴 KRITIS — Bug Fatal | 6 issues | IDOR (6 endpoint), wrong role check, 29 files tanpa try/catch, 22 files tanpa Zod, duplikasi logic, stub email |
| 🟠 SEDANG — Security & Auth | 5 issues | Header spoofing, no rate limit, no CSRF, dangerouslySetInnerHTML, hardcoded passwords |
| 🟠 SEDANG — Code Quality | 4 issues | 92+ `as any`, raw SQL, console.log, duplicate routes |
| 🟡 WARNING — Tersisa | 4 issues | Missing hooks dir, in-memory rate limit, sliding token, root page |
| 📊 DATA — Arsitektural | 4 issues | Role overlap, string→enum, model duplikasi, Siswa/Anggota merge |

**Total: 28+ findings baru** (di luar 68 yang sudah dianalisis sebelumnya)

---

*Dibuat: 2 Juli 2026. Analisis keamanan dan kode otomatis.*
