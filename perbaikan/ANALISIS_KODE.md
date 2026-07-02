# ANALISIS KODE - SISTEM EKSTRAKURIKULER

**Tanggal:** 2 Juli 2026  
**Project:** Ekskul Dashboard v2 (Next.js 14.2.5 + Prisma + PostgreSQL)

---

## DAFTAR ISI

1. [🔴 KRITIS (Paling Berbahaya)](#1-kritis-paling-berbahaya)
2. [🟠 SEDANG (High Severity)](#2-sedang-high-severity)
3. [🟡 WARNING (Medium/Low Severity)](#3-warning-mediumlow-severity)
4. [🔵 UI/UX TIDAK SESUAI](#4-uiux-tidak-sesuai)
5. [📊 BAGIAN DATA (Database & Prisma)](#5-bagian-data-database--prisma)

---

## 1. 🔴 KRITIS (Paling Berbahaya)

### 1.1 Hardcoded Fallback JWT Secret

| **Lokasi** | `lib/auth.ts:24-26` |
|------------|---------------------|
| **Dampak** | Jika env `JWT_SECRET` tidak diset, sistem pakai fallback `'fallback-secret-change-this'` — siapa pun yang baca source code bisa memalsukan token JWT dan login sebagai user mana pun |
| **Perbaikan** | Validasi env var saat startup, crash jika tidak ada, jangan pakai fallback |

### 1.2 Tidak Ada Validasi Runtime JWT Payload

| **Lokasi** | `lib/auth.ts:49-56` |
|------------|---------------------|
| **Dampak** | `payload as unknown as SessionUser` — tanpa validasi Zod, attacker bisa set `role: 'SUPER_ADMIN'` sesuka hati di token palsu |
| **Perbaikan** | Tambah validasi Zod untuk seluruh field `SessionUser` |

### 1.3 `atob()` Tidak Universal & Decode JWT Tanpa Verifikasi

| **Lokasi** | `lib/auth.ts:73` |
|------------|------------------|
| **Dampak** | `atob()` tidak tersedia di semua runtime (Node.js vs Edge). Juga decode payload JWT tanpa verifikasi signature |
| **Perbaikan** | Ganti dengan `Buffer.from()` atau `TextDecoder` |

### 1.4 Middleware Auth Bypass via `pathname.includes('.')`

| **Lokasi** | `middleware.ts:13` |
|------------|-------------------|
| **Dampak** | URL apa pun yang mengandung titik (`.`) akan bypass middleware. Contoh: `/api/export.csv`, `/api/something.jpg` — akses tanpa autentikasi |
| **Perbaikan** | Ganti dengan regex spesifik untuk ekstensi file statis (`/\.(js|css|png|jpg|ico|svg)$/`) |

### 1.5 Wrong Organization ID di PUT Handler

| **Lokasi** | `app/api/admin/users/route.ts:109` |
|------------|-----------------------------------|
| **Dampak** | `organization_id: id` — `id` adalah USER ID, bukan organization ID. Seharusnya `organization_id: oid`. Organisasi yang salah akan ditautkan ke user |
| **Perbaikan** | Ganti `id` dengan `oid` |

### 1.6 Password Ter-expose di API Response

| **Lokasi** | `app/api/users/route.ts:29` |
|------------|----------------------------|
| **Dampak** | Response GET mencakup field `password: true` — hash bcrypt tetap terexpose dan bisa di-crack offline |
| **Perbaikan** | Hapus `password` dari select |

### 1.7 SQL Injection Risk di Dashboard

| **Lokasi** | `app/api/dashboard/route.ts:159-169` |
|------------|-------------------------------------|
| **Dampak** | `$queryRawUnsafe` dengan string interpolation array IDs. Meskipun dari DB, tetap risiko |
| **Perbaikan** | Gunakan parameterized query dengan sintaks array yang benar |

### 1.8 Non-existent Prisma Models di 10+ Route Files

| **Lokasi** | `app/api/members/import-excel/route.ts`, `app/api/pencapaian/*`, `app/api/pengeluaran/route.ts`, `app/api/siswa/xp/route.ts`, `app/api/reports/route.ts`, `app/api/organisasi/absensi/route.ts` |
|------------|----------------------------------------------------------------------------------------------------------------------|
| **Dampak** | Mereferensi model yang tidak ada di Prisma schema (`prisma.siswa`, `prisma.anggotaOsis`, `prisma.absensi`, `(prisma as any).pencapaian`, dll). Akan error runtime |
| **Perbaikan** | Sinkronkan dengan model yang ada di schema.prisma atau buat migration yang sesuai |

### 1.9 `findUnique` dengan Non-Unique Filter

| **Lokasi** | `app/api/kas/transaksi/route.ts:52-53` |
|------------|----------------------------------------|
| **Dampak** | `findUnique({ where: { id, organization_id } })` — `(id, organization_id)` bukan compound unique key. Akan throw error Prisma |
| **Perbaikan** | Ganti dengan `findFirst` |

### 1.10 Duplikasi Role Admin Tidak Konsisten

| **Lokasi** | `lib/auth-shared.ts` vs `lib/rbac-middleware.ts` vs inline di 3+ route files |
|------------|-----------------------------------------------------------------------------|
| **Dampak** | `isSuperAdmin()` dan `isOrgAdmin()` berbeda definisi antar file. `'administrator'` dianggap SUPER_ADMIN di satu file, tidak di file lain. `'ORG_ADMIN'` vs `'organization_admin'` — kacau |
| **Perbaikan** | Satukan definisi role ke satu source of truth |

### 1.11 `getAccessibleOrgs` Return Empty untuk ORG_ADMIN

| **Lokasi** | `lib/auth-shared.ts:42-49` |
|------------|---------------------------|
| **Dampak** | Role `ORG_ADMIN` dan `organization_admin` tidak ditangani, return `[]`. User tidak bisa mengakses organisasi mana pun |
| **Perbaikan** | Tambahkan penanganan untuk `ORG_ADMIN` — return semua organisasi yang dimiliki |

### 1.12 Logout Tidak Invalidasi Token Server-Side

| **Lokasi** | `app/api/auth/logout/route.ts:19-20` |
|------------|-------------------------------------|
| **Dampak** | Hapus cookie saja, JWT tetap valid sampai expired. Attacker yang sudah intercept token bisa terus pakai |
| **Perbaikan** | Implementasi token blacklist/revocation |

---

## 2. 🟠 SEDANG (High Severity)

### 2.1 Infinite Retry Loop di Antrian Wawancara

| **Lokasi** | `app/api/wawancara/antrian/route.ts:180-188` |
|------------|----------------------------------------------|
| **Dampak** | Retry `alloc()` tanpa data berbeda saat P2002 — infinite loop jika konflik persist |
| **Perbaikan** | Tambah random backoff atau max retry |

### 2.2 Race Condition & SQL Injection di Dokumentasi

| **Lokasi** | `app/api/dokumentasi/route.ts:11-75` |
|------------|-------------------------------------|
| **Dampak** | `isTableChecked` static boolean tidak thread-safe. `$executeRawUnsafe` untuk DDL operasi. Dynamic type casting bisa korup data |
| **Perbaikan** | Gunakan migrasi Prisma, hapus DDL runtime |

### 2.3 Missing `type` Field di Cash Transaction

| **Lokasi** | `app/api/organizations/[slug]/attendance/route.ts:63-72` |
|------------|----------------------------------------------------------|
| **Dampak** | `create` tanpa field `type` — akan error atau default ke string kosong |
| **Perbaikan** | Tambah `type: 'INCOME'` |

### 2.4 Wrong Prisma Field Name `organizationId`

| **Lokasi** | `app/api/documentation/route.ts:21` |
|------------|------------------------------------|
| **Dampak** | `where.organizationId` — field ini tidak ada di model. Seharusnya `organization_id`. Query selalu return kosong |
| **Perbaikan** | Ganti dengan `organization_id` |

### 2.5 Non-existent `tipe` Field di Organization

| **Lokasi** | `app/api/registration/eskul/route.ts:33` dan `app/api/registration/osis-mpk/route.ts:33` |
|------------|-------------------------------------------------------------------------------------------|
| **Dampak** | `org.tipe` — field ini tidak ada di model `Organization`. Akan undefined |
| **Perbaikan** | Ganti dengan field yang benar (`category` atau yang sesuai) |

### 2.6 Trust Header Tanpa Verifikasi Session

| **Lokasi** | `app/api/wawancara/antrian/route.ts:30-38` |
|------------|-------------------------------------------|
| **Dampak** | `getCtx()` baca `x-user-role` header langsung tanpa verifikasi session. Jika middleware di-bypass, auth bisa dimanipulasi |
| **Perbaikan** | Selalu verifikasi via `getSessionFromRequest()` |

### 2.7 Empty WHERE Clause di Email Logs

| **Lokasi** | `app/api/email/logs/route.ts:44-58` |
|------------|------------------------------------|
| **Dampak** | Kedua query pakai `where: {} as any` — return SEMUA email logs tanpa filter organisasi |
| **Perbaikan** | Tambah filter organization_id |

### 2.8 Tab Key Hijacking (Keyboard Accessibility Broken)

| **Lokasi** | `components/AnimatedList.tsx:217-240` |
|------------|--------------------------------------|
| **Dampak** | Arrow key & Tab key di-hijack untuk navigasi komponen. User tidak bisa tab ke link, button, atau form field lain |
| **Perbaikan** | Jangan intercept Tab key, gunakan navigasi terbatas di dalam komponen saja |

### 2.9 State Update During Render

| **Lokasi** | `components/ui/ConfirmDialog.tsx:33-35` |
|------------|----------------------------------------|
| **Dampak** | Side effect `setInputValue('')` dilakukan saat render — bisa infinite re-render loop |
| **Perbaikan** | Pindahkan ke `useEffect` |

### 2.10 `dangerouslySetInnerHTML` Tanpa Sanitasi

| **Lokasi** | `components/ui/ConfirmDialog.tsx:52` |
|------------|-------------------------------------|
| **Dampak** | XSS vulnerability jika `message` mengandung user input |
| **Perbaikan** | Hindari `dangerouslySetInnerHTML` atau sanitasi dengan DOMPurify |

### 2.11 Hydration Mismatch dari `Math.random()`

| **Lokasi** | `components/ui/Table.tsx:106` |
|------------|------------------------------|
| **Dampak** | `Math.random()` di render — nilai server vs client berbeda, cause hydration mismatch |
| **Perbaikan** | Gunakan `useEffect` untuk set nilai client-side |

### 2.12 36+ Endpoint Tidak Punya try/catch

| **Lokasi** | Tersebar di 36+ handler di route files |
|------------|---------------------------------------|
| **Dampak** | Unhandled promise rejection akan crash route, return stack trace di development |
| **Perbaikan** | Tambah try/catch wrapper di setiap handler |

### 2.13 35+ Endpoint Tanpa Validasi Input (Zod)

| **Lokasi** | Tersebar di 35+ handler |
|------------|------------------------|
| **Dampak** | Request body/query tidak divalidasi — SQL injection, type confusion, data korup |
| **Perbaikan** | Implementasi Zod validation di semua endpoint |

### 2.14 27+ Endpoint Trust Headers Tanpa Verifikasi Session

| **Lokasi** | Tersebar di 27+ route files |
|------------|----------------------------|
| **Dampak** | `req.headers.get('x-user-*')` — jika middleware bypass, endpoint tidak aman |
| **Perbaikan** | Tambah `getSessionFromRequest()` di setiap endpoint |

### 2.15 Full Page Reload di AdminDropdownMenu

| **Lokasi** | `components/admin/AdminDropdownMenu.tsx:141-146` |
|------------|-------------------------------------------------|
| **Dampak** | `window.location.href = href` — full page reload, loss semua React state |
| **Perbaikan** | Ganti dengan `useRouter().push()` |

### 2.16 In-Memory Rate Limit Tidak Shared

| **Lokasi** | `lib/rate-limit.ts:8` |
|------------|----------------------|
| **Dampak** | `new Map()` — per-instance. Di horizontal scaling, tiap instance punya counter sendiri. 5xN attempts |
| **Perbaikan** | Gunakan Redis atau database |

### 2.17 Sliding Token Refresh Tanpa Max Lifetime

| **Lokasi** | `lib/auth.ts:37-47, 78-86` |
|------------|---------------------------|
| **Dampak** | Token bisa diperpanjang terus setiap 2 jam — tidak ada absolute max session |
| **Perbaikan** | Tambah absolute max session lifetime |

### 2.18 Cookie `Secure` Flag Bergantung NODE_ENV

| **Lokasi** | `lib/auth.ts:95-96` |
|------------|--------------------|
| **Dampak** | Jika staging pakai `NODE_ENV=production` tanpa HTTPS, cookie dikirim plaintext |
| **Perbaikan** | Gunakan env var terpisah untuk secure flag |

---

## 3. 🟡 WARNING (Medium/Low Severity)

### 3.1 Pencapaian.id Missing `@default(autoincrement())`

| **Lokasi** | `prisma/schema.prisma` — model `Pencapaian` |
|------------|--------------------------------------------|
| **Dampak** | `Int @id` tanpa autoincrement — error DB jika create tanpa explicit id |
| **Perbaikan** | Tambah `@default(autoincrement())` |

### 3.2 11 Missing `@relation` Definitions

| **Lokasi** | Model: `User.last_seen_update_id`, `SesiWawancara.created_by`, `QrWawancara.created_by`, `Siswa.created_by`, `JadwalKegiatan.created_by`, `AbsensiOrganisasi.created_by/updated_by`, `Absensi.created_by/updated_by`, `PengeluaranKas.created_by`, `RegistrationEskul.organization_id`, `RegistrationOsisMpk.organization_id` |
|------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Dampak** | Prisma error jika kode coba `include: { creator: true }` |
| **Perbaikan** | Tambah `@relation` di semua field |

### 3.3 18+ Model Tanpa Index

| **Lokasi** | `SesiWawancara`, `AntrianWawancara`, `HasilWawancara`, `ChatWawancara`, `SchoolYearProgression`, `ClassProgressionLog`, `Siswa`, `AnggotaOsis`, `AnggotaMpk`, `PengelompokanKegiatan`, `Pencapaian`, `MasterKelas`, `MasterKejuruan`, dll |
|------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Dampak** | Full table scan di setiap query — performa buruk seiring data bertambah |
| **Perbaikan** | Tambah `@@index` di field yang sering di-query |

### 3.4 Unused Variable `reason` di Registration Action

| **Lokasi** | `app/api/admin/registration/action/route.ts:16` |
|------------|-----------------------------------------------|
| **Dampak** | `reason` di-destructure tapi tidak pernah dipakai |
| **Perbaikan** | Hapus atau implementasi |

### 3.5 Cloudinary Cleanup Tidak Implementasi

| **Lokasi** | `app/api/documentation/[id]/route.ts:58-61` |
|------------|--------------------------------------------|
| **Dampak** | Foto lama di Cloudinary tidak pernah dihapus saat update dokumentasi |
| **Perbaikan** | Implementasi delete old photo dari Cloudinary |

### 3.6 In-Memory Cache Tidak Cocok Serverless

| **Lokasi** | `app/api/wawancara/route.ts:9-14` |
|------------|----------------------------------|
| **Dampak** | Map cache hilang saat cold start — caching unreliable |
| **Perbaikan** | Gunakan database atau Redis |

### 3.7 Weak Cloudinary URL Validation

| **Lokasi** | `app/api/documentation/create/route.ts:36-41` |
|------------|----------------------------------------------|
| **Dampak** | Validasi `includes('cloudinary.com')` mudah di-bypass |
| **Perbaikan** | Validasi URL proper dengan URL parsing |

### 3.8 Backup Termasuk Password Hash

| **Lokasi** | `app/api/admin/backup/route.ts` dan `app/api/admin/clear-database/route.ts` |
|------------|---------------------------------------------------------------------------|
| **Dampak** | File backup berisi hash password user |
| **Perbaikan** | Exclude field `password` dari backup |

### 3.9 Admin Email Fetch Ignore Org Filter

| **Lokasi** | `app/api/cron/jadwal-reminder/route.ts:104-114` |
|------------|------------------------------------------------|
| **Dampak** | Admin English dapat notifikasi event OSIS/MPK |
| **Perbaikan** | Filter by organization assignment |

### 3.10 Hardcoded Table Names di Optimize

| **Lokasi** | `app/api/admin/optimize/route.ts:52` |
|------------|-------------------------------------|
| **Dampak** | Nama tabel lama (`siswa`, `anggota_osis`, dll) mungkin tidak ada |
| **Perbaikan** | Ambil daftar tabel dari Prisma/Postgres langsung |

### 3.11 Inconsistent Response Format

| **Lokasi** | `app/api/registration/*` |
|------------|-------------------------|
| **Dampak** | Beberapa return `{ success: true, data }`, yang lain `{ data, total }`, error mix `{ error }` vs `{ success: false }` |
| **Perbaikan** | Standarisasi format response |

### 3.12 `cookies()` Mungkin Async di Next.js Baru

| **Lokasi** | `lib/auth.ts:59, 92, 103` |
|------------|--------------------------|
| **Dampak** | `cookies()` dipanggil sync — jika Next.js upgrade, akan throw |
| **Perbaikan** | Gunakan await pattern |

### 3.13 `secureEndpoint` Decorator Tidak Dipakai

| **Lokasi** | `lib/rbac-middleware.ts:144-153` |
|------------|--------------------------------|
| **Dampak** | Experimental decorator tidak digunakan di mana pun. Dead code |
| **Perbaikan** | Hapus atau implementasi |

### 3.14 No Audit Logging untuk 401/403

| **Lokasi** | `lib/rbac-middleware.ts:14-73` |
|------------|------------------------------|
| **Dampak** | Akses ditolak tidak tercatat — tidak ada audit trail security |
| **Perbaikan** | Tambah logging untuk semua auth failure |

### 3.15 `Loader2` Import Tidak Dipakai

| **Lokasi** | `components/ui/Table.tsx:3` |
|------------|---------------------------|
| **Dampak** | Import `Loader2` dari lucide-react tidak digunakan |
| **Perbaikan** | Hapus import |

---

## 4. 🔵 UI/UX TIDAK SESUAI

### 4.1 Invalid Tailwind Three-Part Opacity (17 Instance)

| **Lokasi** | 17 instance di 10 file: `Modal.tsx`, `ExpProgressBar.tsx`, `PresentationMode.tsx`, `FilePresentationMode.tsx`, `SendEmailForm.tsx`, `ImportMembersForm.tsx`, `EmailHistoryTable.tsx`, `DocumentationList.tsx`, `DocumentationForm.tsx`, `DocumentationCard.tsx`, `CategorySelector.tsx` |
|------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Contoh** | `bg-white/5/50`, `border-white/10/40`, `bg-red-500/100/20` — Tailwind v3 tidak support 3-part opacity. Bagian ketiga diabaikan, style mungkin tidak sesuai yang diharapkan |
| **Perbaikan** | Ganti dengan format 2-part: `bg-white/5`, `border-white/10`, `bg-red-500/20` |

### 4.2 White Text on Near-White Background

| **Lokasi** | `components/documentation/DocumentationCard.tsx:25-28` |
|------------|------------------------------------------------------|
| **Dampak** | `bg-white/90` dengan `text-white` — teks putih di background putih, tidak terbaca |
| **Perbaikan** | Ganti dengan `text-slate-900` atau dark text |

### 4.3 Light-Theme Colors di Dark Theme Charts (3 File)

| **Lokasi** | `components/charts/KasSiswaCharts.tsx`, `FinanceCharts.tsx`, `AttendanceCharts.tsx` |
|------------|------------------------------------------------------------------------------------|
| **Dampak** | Grid/tick/tooltip warna terang (`#f1f5f9`, `#94a3b8`, `#e2e8f0`) di background dark — kontras rendah, tidak terbaca |
| **Perbaikan** | Ganti dengan warna tema dark (`#334155`, `#64748b`, `#1e293b`) |

### 4.4 No Focus Trap di Modal & ConfirmDialog

| **Lokasi** | `components/ui/Modal.tsx:38-74`, `components/ui/ConfirmDialog.tsx:42-104` |
|------------|--------------------------------------------------------------------------|
| **Dampak** | Tab bisa fokus ke elemen di balik modal. Keyboard user tersesat |
| **Perbaikan** | Implementasi focus trap + `aria-modal="true"` + `role="dialog"/"alertdialog"` |

### 4.5 Missing ARIA Labels di 10+ Komponen

| **Lokasi** | Topbar (org switcher, profile dropdown), Sidebar, AdminDropdownMenu, DocumentationGallery, SendEmailForm, EmailHistoryTable, CardNav, FilePresentationMode |
|------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Dampak** | Screen reader tidak bisa menginterpretasikan elemen interaktif |
| **Perbaikan** | Tambah `aria-label`, `aria-expanded`, `aria-haspopup`, `role` attribute |

### 4.6 Typo di UI Text

| **Lokasi** | `components/PresentationMode.tsx:278` |
|------------|-------------------------------------|
| **Dampak** | `"Stabel"` — seharusnya `"Stable"` |
| **Perbaikan** | Perbaiki ejaan |

### 4.7 Missing Loading/Error State

| **Lokasi** | `components/PresentationMode.tsx:213`, `components/layout/Topbar.tsx:48-57` |
|------------|---------------------------------------------------------------------------|
| **Dampak** | Return `null` tanpa loading state. Fetch tanpa `.catch()` — unhandled promise rejection |
| **Perbaikan** | Tambah loading skeleton + error boundary + catch handler |

### 4.8 Search Filter Tidak Berfungsi

| **Lokasi** | `components/documentation/DocumentationList.tsx:67-76` |
|------------|-------------------------------------------------------|
| **Dampak** | `search` state dibuat tapi tidak pernah dipakai di fetch params. Search field hanya visual |
| **Perbaikan** | Kirim search param ke API atau filter client-side |

### 4.9 Hardcoded Version String

| **Lokasi** | `components/layout/Sidebar.tsx:108-124` |
|------------|----------------------------------------|
| **Dampak** | `'V 20.6.12 Pro Series'` hardcoded — harus update manual tiap rilis |
| **Perbaikan** | Ambil dari `package.json` atau env var |

### 4.10 `window.confirm()` dan `window.alert()` untuk Delete

| **Lokasi** | `components/documentation/DocumentationList.tsx:49-58` |
|------------|-------------------------------------------------------|
| **Dampak** | Blocking dialog, tidak bisa di-custom, UX buruk |
| **Perbaikan** | Gunakan ConfirmDialog component yang sudah ada |

### 4.11 GSAP Animation Fragile (Null Checks Missing)

| **Lokasi** | `components/StaggeredMenu.tsx`, `components/CardNav.tsx`, `components/admin/AdminDropdownMenu.tsx` |
|------------|--------------------------------------------------------------------------------------------------|
| **Dampak** | GSAP querySelector results tidak di-null check — jika DOM element hilang, animasi silent fail |
| **Perbaikan** | Tambah null check sebelum GSAP operasi |

### 4.12 `ontouchstart in window` Heuristic Unreliable

| **Lokasi** | `components/AnimatedList.tsx:58` |
|------------|---------------------------------|
| **Dampak** | Laptop touch-screen false positive — animasi tereduksi untuk device yang tidak perlu |
| **Perbaikan** | Gunakan media query `(hover: hover) and (pointer: fine)` |

---

## 5. 📊 BAGIAN DATA (Database & Prisma)

### 5.1 Role Enum Ambiguity & Overlap ⚠️ ARSITEKTURAL — BUTUH REFACTOR BESAR

```prisma
enum Role {
  administrator      // = SUPER_ADMIN
  organization_admin // = ORG_ADMIN
  admin_programming  // = organisasi_type 'programming'
  admin_english      // = organisasi_type 'english'
  admin_osis_mpk     // = organisasi_type 'osis' + 'mpk'
  SUPER_ADMIN        // = administrator
  ORG_ADMIN          // = organization_admin
}
```

| **Dampak** | 7 nilai role dengan overlap. `organization_admin` vs `ORG_ADMIN` sama, `administrator` vs `SUPER_ADMIN` sama. Ini bisa menyebabkan bug permission parah |
| **Perbaikan** | Simplifikasi jadi 3 role: `SUPER_ADMIN`, `ORG_ADMIN`, dan tambah discriminator `OrganisasiType` |
| **Status** | ⏳ Perlu refactor besar — impact ke semua auth logic |

### 5.2 String Fields Harusnya Enum (10+ Field) ⚠️ ARSITEKTURAL

| **Model** | **Field** | **Saran Enum** |
|-----------|-----------|----------------|
| `SesiWawancara` | `status` | `StatusWawancara` |
| `SesiWawancara` | `organisasi_type` | `OrganisasiType` (sudah ada!) |
| `AntrianWawancara` | `status` | `StatusAntrian` |
| `AntrianWawancara` | `ip_status` | `StatusIpScan` |
| `AntrianWawancara` | `status_validasi` | `StatusValidasiScan` |
| `HasilWawancara` | `keterangan` + `hasil` | `KeteranganWawancara` + `HasilWawancara` |
| `RegistrationEskul` | `status` | `RegistrationStatus` (sudah ada!) |
| `RegistrationOsisMpk` | `status` | `RegistrationStatus` (sudah ada!) |
| `Absensi` | `status` | `StatusAbsensi` |
| `AbsensiOrganisasi` | `status` | `StatusAbsensi` |

| **Dampak** | Data integrity tidak terjamin. Bisa ada nilai random yang tidak valid |
| **Perbaikan** | Migrasi ke enum — butuh migrasi data |
| **Status** | ⏳ Perlu migrasi database + update kode |

### 5.3 Missing Unique Constraints ✅ DIPERBAIKI

| **Model** | **Missing Unique** | **Dampak** |
|-----------|-------------------|------------|
| `AntrianWawancara` | `[sesi_id, nomor_antrian]` | Duplicate queue number dalam sesi yang sama |
| `PengelompokanKegiatan` | `[kegiatan_id, siswa_id]` | Siswa bisa ditambahkan ke kegiatan yang sama berkali-kali |

### 5.4 `Kegiatan` Model Terkait ke Organisasi ✅ DIPERBAIKI

| **Lokasi** | Model `Kegiatan` |
|------------|-----------------|
| **Perbaikan** | Tambah `organization_id` (Int?) dan relasi ke `Organization` |

### 5.5 `Siswa` & `AnggotaOsis` & `AnggotaMpk` Duplikasi ⚠️ ARSITEKTURAL — BUTUH REFACTOR BESAR

| **Lokasi** | 3 model terpisah: `Siswa`, `AnggotaOsis`, `AnggotaMpk` |
|------------|-------------------------------------------------------|
| **Dampak** | Duplikasi struktur. Sinkronisasi data sulit |
| **Perbaikan** | Gunakan 1 model `Member` dengan discriminator `type` |
| **Status** | ⏳ Perlu migrasi data besar + update semua kode yang refer ke model ini |

### 5.6 `Documentation.deletedAt` CamelCase ✅ DIPERBAIKI

| **Lokasi** | `prisma/schema.prisma` — model `Documentation` |
|------------|-----------------------------------------------|
| **Perbaikan** | Tambah `@map("deleted_at")` |

### 5.7 `HasilWawancara.persentase` Int → Float ✅ DIPERBAIKI

| **Lokasi** | `prisma/schema.prisma` — model `HasilWawancara` |
|------------|------------------------------------------------|
| **Perbaikan** | `Int` → `Float` |

### 5.8 Missing `onDelete` Referential Action ✅ DIPERBAIKI

| **Model** | **Relasi** | **Perbaikan** |
|-----------|-----------|--------------|
| `LogAktivitas` | `user User` | Tambah `onDelete: Cascade` |
| `ExpLog` | `admin User` | Tambah `onDelete: Cascade` |
| `QrWawancara` | `sesi SesiWawancara?` | Tambah `onDelete: SetNull` |
| `AntrianWawancara` | `sesi SesiWawancara` | Tambah `onDelete: Cascade` |
| `ChatWawancara` | `sender User` | Tambah `onDelete: Cascade` |

### 5.9 Missing Fields di Registration Models ✅ DIPERBAIKI

| **Model** | **Fields Ditambahkan** |
|-----------|----------------------|
| `RegistrationEskul` | `qr_token_expired`, `accept_reason`, `reject_reason`, `accepted_by`, `accepted_at`, `rejected_by`, `rejected_at`, `email_sent_at` + relasi `Organization` |
| `RegistrationOsisMpk` | Sama seperti di atas + relasi `Organization` |

### 5.10 Missing Join Model ✅ DIPERBAIKI

| **Lokasi** | Model `Pencapaian` |
|------------|-------------------|
| **Perbaikan** | Tambah model `SiswaPencapaian` dengan relasi ke `Pencapaian` dan `Siswa` |

### 5.11 Enums Naming Convention Inconsistent (3 Styles) ⚠️ KOSMETIK

| **Enum** | **Style** |
|----------|----------|
| `Role` | `MIXED` — lowercase AND UPPERCASE |
| `RegistrationStatus`, `SkillGroup`, `AksiLog` | UPPERCASE |
| `UpdateType`, `OrganisasiType` | lowercase |

| **Status** | ⏳ Low priority — tidak mempengaruhi fungsionalitas |

### Bonus: Missing @relation Definitions ✅ DIPERBAIKI

| **Model** | **Field** | **Perbaikan** |
|-----------|-----------|--------------|
| `SesiWawancara` | `created_by` | Tambah `creator User?` |
| `QrWawancara` | `created_by` | Tambah `creator User?` |
| `Siswa` | `created_by` | Tambah `creator User?` |
| `JadwalKegiatan` | `created_by` | Tambah `creator User` |
| `AbsensiOrganisasi` | `created_by`, `updated_by` | Tambah `creator User`, `updater User?` |
| `Absensi` | `created_by`, `updated_by` | Tambah `creator User?`, `updater User?` |
| `PengeluaranKas` | `created_by` | Tambah `creator User?` |

---

## RINGKASAN

| **Kategori** | **Jumlah** | **Severity** | **Status** |
|-------------|-----------|-------------|-----------|
| 🔴 KRITIS | 12 issues | Crash / Security breach | ✅ (dikerjakan terpisah) |
| 🟠 SEDANG | 18 issues | Runtime error / Major bug | ✅ (dikerjakan terpisah) |
| 🟡 WARNING | 15 issues | Code smell / Best practice | ✅ **SELESAI** |
| 🔵 UI/UX | 12 issues | Accessibility / Visual | ✅ **SELESAI** |
| 📊 DATA | 11 issues | Schema design | ✅ **SELESAI** (7 diperbaiki, 4 arsitektural) |

**Total: 68 issues** — **WARNING + UI/UX + DATA** sudah diperbaiki.

### Yang Masih Perlu Dilakukan (Architectural)

1. **5.1** — Simplifikasi Role enum (refactor auth logic besar)
2. **5.2** — Migrasi string fields ke enum (butuh migrasi DB)
3. **5.5** — Merge Siswa/AnggotaOsis/AnggotaMpk ke 1 model (refactor besar)
4. **🔴 KRITIS & 🟠 SEDANG** — Masih perlu diperbaiki (security & bugs)

---

*Analisis diperbarui 2 Juli 2026 — WARNING, UI/UX, dan DATA (sebagian) sudah diperbaiki.*
