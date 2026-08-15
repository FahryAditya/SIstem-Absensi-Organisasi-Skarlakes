# Laporan Analisis Aliran Data (Data Flow Analysis)

> **Proyek:** Sistem Ekstrakurikuler SMK Airlangga Balikpapan — Artemis Series v2.0.0
> **Tanggal:** 11 Juli 2026
> **Fokus:** Input/Create, Read/Output, Update, Delete — logika aliran data

---

## 🔴 1. MASALAH INPUT / CREATE DATA

### 1.1 Tidak Ada Validasi Duplikat
| Endpoint | File:Baris | Masalah |
|----------|-----------|---------|
| POST `/api/kegiatan` | `app/api/kegiatan/route.ts:47` | Tidak cek duplikat `nama_kegiatan` sebelum create |
| POST `/api/organizations/[slug]/members` | `app/api/organizations/[slug]/members/route.ts:48-59` | Tidak cek duplikat `name` dalam satu organisasi |
| POST `/api/admin/users` | `app/api/admin/users/route.ts:48-81` | Tidak cek duplikat `email` sebelum create user |
| POST `/api/organizations` | `app/api/organizations/route.ts:64-97` | Tidak cek duplikat `slug` sebelum create |
| POST `/api/registration` | `app/api/registration/route.ts:16-71` | Pengecekan email hanya untuk status `MENUNGGU`/`CALON`, bukan `DITERIMA` |
| POST `/api/registration/eskul` | `app/api/registration/eskul/route.ts:17-73` | Tidak cek di tabel `siswa` untuk duplikat |
| POST `/api/registration/osis-mpk` | `app/api/registration/osis-mpk/route.ts:17-73` | Tidak cek di tabel `anggota_osis`/`anggota_mpk` |

### 1.2 Input Tidak Tervalidasi / Langsung Spread
| Endpoint | File:Baris | Masalah |
|----------|-----------|---------|
| POST `/api/kegiatan` | `app/api/kegiatan/route.ts:40-53` | `tipe` tidak divalidasi enum, nilai sembarang bisa masuk |
| POST `/api/organizations/[slug]/members` | `app/api/organizations/[slug]/members/route.ts:25-66` | Spread body langsung ke Prisma `create` tanpa Zod/tipedata |
| PUT `/api/organisasi` | `app/api/organisasi/route.ts:140-183` | Spread body langsung — field `name` dan `nama` ambigu, bisa overwrite NULL |
| PUT `/api/jadwal` | `app/api/jadwal/route.ts:95-135` | Organisasi bisa diubah ke organisasi yang tidak diizinkan |
| PUT `/api/users` | `app/api/users/route.ts:113-172` | `password: null` bisa masuk & di-hash jadi error |

### 1.3 Keamanan Input Bermasalah
| Endpoint | File:Baris | Masalah |
|----------|-----------|---------|
| POST `/api/flutter/auth/register` | `app/api/flutter/auth/register/route.ts:48-55` | **CRITICAL**: Siapa pun daftar dapat role `ORG_ADMIN` |
| POST `/api/import-excel` | `app/api/import-excel/route.ts:83-86` | `skipDuplicates: true` tapi tidak ada unique constraint pada `name` |
| POST `/api/pengeluaran` | `app/api/pengeluaran/route.ts:68-122` | Tidak cek saldo sebelum create — bisa overdraft |

### 1.4 Model Tidak Ada di Schema Prisma (Query Error Runtime)
| Endpoint | File:Baris | Masalah |
|----------|-----------|---------|
| POST `/api/pencapaian/berikan` | `app/api/pencapaian/berikan/route.ts:51,56,61,76` | `tx.siswaPencapaian` — model **tidak ada** di Prisma schema |
| POST `/api/pencapaian/award` | `app/api/pencapaian/award/route.ts:70,79,107,119` | `tx.siswaPencapaian` — model **tidak ada** di Prisma schema |
| GET `/api/pencapaian/berikan` | `app/api/pencapaian/berikan/route.ts:156` | `(prisma as any).siswaPencapaian.findMany()` — runtime error jika tabel tidak ada |

### 1.5 ID Auto-Increment Hilang
| Model | File:Baris | Masalah |
|-------|-----------|---------|
| `Pencapaian` | `prisma/schema.prisma:738` | `id Int @id` — **tidak ada** `@default(autoincrement())` |

---

## 🟡 2. MASALAH READ / OUTPUT DATA

### 2.1 Data Leakage (Kebocoran Data)
| Endpoint | File:Baris | Masalah |
|----------|-----------|---------|
| GET `/api/organizations/[slug]/members` | `app/api/organizations/[slug]/members/route.ts:8-23` | **Tidak ada RBAC** — siapa pun bisa lihat anggota organisasi manapun |
| GET `/api/organizations/[slug]/cash` | `app/api/organizations/[slug]/cash/route.ts:4-31` | **Tidak ada RBAC** — data kas publik |
| GET `/api/organizations/[slug]/attendance` | `app/api/organizations/[slug]/attendance/route.ts:8-28` | **Tidak ada RBAC** — absensi publik |
| GET `/api/wawancara/export` | `app/api/wawancara/export/route.ts:30-118` | **Ekspor IP address, GPS, token QR** — data sensitif siswa bocor |
| GET `/api/registration/check-email` | `app/api/registration/check-email/route.ts:6-45` | Endpoint **publik tanpa rate limit** — email enumerasi |

### 2.2 Tidak Ada Pagination
| Endpoint | File:Baris | Masalah |
|----------|-----------|---------|
| GET `/api/registration` | `app/api/registration/route.ts:73-100` | Semua registration diambil — OOM risk |
| GET `/api/dokumentasi` | `app/api/dokumentasi/route.ts:69-137` | Semua foto dikembalikan — response bisa besar |
| GET `/api/kas` | `app/api/kas/route.ts:11-116` | Limit bisa diubah ke nilai besar — `limit` tidak dibatasi maksimal |

### 2.3 Data Tidak Terfilter
| Endpoint | File:Baris | Masalah |
|----------|-----------|---------|
| GET `/api/dashboard` | `app/api/dashboard/route.ts:18-361` | Tidak filter `organization.status === 'Aktif'` — data org nonaktif muncul |
| GET `/api/wawancara/public` | `app/api/wawancara/public/route.ts:4-64` | Jumlah antrian dari **semua** sesi, bukan sesi QR spesifik |
| GET `/api/flutter/organizations` | `app/api/flutter/organizations/route.ts:48-67` | Semua organisasi tanpa filter JWT user |

---

## 🟠 3. MASALAH UPDATE DATA

### 3.1 Update Overwrite / Data Loss
| Endpoint | File:Baris | Masalah |
|----------|-----------|---------|
| PUT `/api/organisasi` | `app/api/organisasi/route.ts:156-165` | `name: undefined` bisa overwrite field dengan NULL |
| PUT `/api/admin/users` | `app/api/admin/users/route.ts:105-116` | Hapus dulu semua `organizationAdmin`, lalu create baru — jika gagal di tengah, user kehilangan akses ke **semua** organisasi |
| PUT `/api/documentation/[id]` | `app/api/documentation/[id]/route.ts:34-111` | Foto Cloudinary dihapus setiap update walau hanya title diubah |
| PUT `/api/pencapaian` | `app/api/pencapaian/route.ts:85-117` | Tidak cek organisasi — admin bisa edit pencapaian org lain |
| PUT `/api/jadwal` | `app/api/jadwal/route.ts:95-135` | Hanya validasi existing organisasi, bukan organisasi baru |

### 3.2 Race Condition & Transaction
| Endpoint | File:Baris | Masalah |
|----------|-----------|---------|
| POST `/api/absensi` | `app/api/absensi/route.ts:141` | Update EXP di dalam transaction absensi massal — bisa timeout/deadlock |
| POST `/api/kas/transaksi` | `app/api/kas/transactions/route.ts:80-164` | Create + verification di luar transaction — TOCTOU |
| POST `/api/wawancara/antrian` | `app/api/wawancara/antrian/route.ts:153-158` | Nomor antrian dihitung di luar transaction — race condition nomor duplikat |

### 3.3 Duplikasi Data pada Update
| Endpoint | File:Baris | Masalah |
|----------|-----------|---------|
| PUT `/api/organizations/[slug]/attendance` | `app/api/organizations/[slug]/attendance/route.ts:66-76` | **CRITICAL**: Setiap update absensi bikin transaksi kas BARU — double counting |
| POST `/api/pencapaian/award` | `app/api/pencapaian/award/route.ts:87-95,127-135` | `updateExp` dipanggil dengan `tipeAnggota: 'siswa'` tapi query `Member` — data XP/level korup |

---

## 🔴 4. MASALAH DELETE DATA

### 4.1 Delete Tanpa WHERE — Global Deletion
| Endpoint | File:Baris | Masalah |
|----------|-----------|---------|
| DELETE `/api/log` | `app/api/log/route.ts:55` | `deleteMany()` **tanpa where** — semua log aktivitas terhapus |
| POST `/api/admin/clear-wawancara` | `app/api/admin/clear-wawancara/route.ts:42` | `deleteMany()` **tanpa where** — semua sesi wawancara global terhapus |

### 4.2 Delete Tanpa Cek Dependensi
| Endpoint | File:Baris | Masalah |
|----------|-----------|---------|
| DELETE `/api/kegiatan` | `app/api/kegiatan/route.ts:85` | Tidak cek `pengelompokanKegiatan` — FK error jika ada dependensi |
| DELETE `/api/admin/users` | `app/api/admin/users/route.ts:124-143` | Tidak hapus relasi (OrgAdmin, LogAktivitas) dulu — FK error |
| DELETE `/api/organizations/[slug]/admins` | `app/api/organizations/[slug]/admins/route.ts:96-133` | Tidak cek admin terakhir — organisasi bisa kehilangan semua admin |

### 4.3 Backup Sebelum Delete Bermasalah
| Endpoint | File:Baris | Masalah |
|----------|-----------|---------|
| POST `/api/admin/clear-database` | `app/api/admin/clear-database/route.ts:60-90` | Backup **semua** data (semua user, semua org) saat hapus 1 org — kebocoran data |

### 4.4 Cascade Delete Tidak Konsisten
| Model | File:Baris | Masalah |
|-------|-----------|---------|
| `LogAktivitas` → `User` | `prisma/schema.prisma:189` | **Tidak ada** `onDelete: Cascade` — tidak bisa hapus user jika ada logs |
| `Documentation` → `User` | `prisma/schema.prisma:210` | Tidak ada cascade |
| `DokumentasiFoto` → `User` | `prisma/schema.prisma:229` | Tidak ada cascade |
| `ExpLog` → `User` | `prisma/schema.prisma:301` | Tidak ada cascade |
| `ChatWawancara` → `User` | `prisma/schema.prisma:480` | Tidak ada cascade |
| `HasilWawancara` → `User` | `prisma/schema.prisma:501-502` | Tidak ada cascade |
| `AbsensiOrganisasi` → `AnggotaOsis`/`AnggotaMpk` | `prisma/schema.prisma:660-661` | Tidak ada cascade |

---

---

## 🟠 5. MASALAH FRONTEND & UI

### 5.1 Password Disimpan di localStorage Plaintext
| File | Baris |
|------|-------|
| `app/login/page.tsx` | 49 |

Password dan data login disimpan di `localStorage` dalam bentuk **plain text**. Jika terjadi XSS, password bisa dicuri.

### 5.2 Login Tidak Cek Session — Selalu Redirect ke /login
| File | Baris |
|------|-------|
| `app/page.tsx` | 2 |

```typescript
redirect('/login')   // ❌ Tidak cek apakah user sudah login
```
User yang sudah login dan mengakses `/` akan selalu di-redirect ke `/login`.

### 5.3 Greeting & Jam Frozen — `now` Tidak Pernah Update
| File | Baris |
|------|-------|
| `app/dashboard/DashboardClient.tsx` | 108, 356-357 |

```typescript
const [now] = useState(new Date())   // ❌ Destructuring tanpa setter — never updates
```
Greeting `Selamat pagi/siang/sore/malam` dan jam akan tetap sama sepanjang sesi.

### 5.4 Empty Catch Blocks — Silent Failure
| File | Baris |
|------|-------|
| `app/dashboard/DashboardClient.tsx` | 169, 181 |

```typescript
catch {}   // ❌ Error ditelan diam-diam
```
Jika API dashboard gagal, user tidak dapat feedback.

### 5.5 useEffect Dependency Tidak Lengkap
| File | Baris |
|------|-------|
| `app/dashboard/DashboardClient.tsx` | 238 |

Hanya dependency `[user.role]` tapi di dalamnya referensi banyak fungsi lain yang bisa stale.

### 5.6 Duplicate Submission Risk
| File | Baris |
|------|-------|
| `app/registration/form/page.tsx` | 69-96 |

Tidak ada idempotency key atau disabled state untuk mencegah double-submit.

### 5.7 No Error State di Registration Page
| File | Baris |
|------|-------|
| `app/registration/page.tsx` | 12-21 |

Jika fetch organisasi gagal, user hanya lihat grid kosong tanpa pesan error.

### 5.8 Keyboard Event Listener Stale Closure
| File | Baris |
|------|-------|
| `components/FilePresentationMode.tsx` | 173-192 |

Event listener mereferensi `nextSlide`, `prevSlide` yang tidak ada di dependency array.

### 5.9 Select Dropdown Event Listener Accumulation
| File | Baris |
|------|-------|
| `components/ui/Select.tsx` | 96-127 |

Scroll/resize listener bisa menumpuk karena dependency `calcPos` berubah tiap render.

### 5.10 ConfirmDialog Object Dependency
| File | Baris |
|------|-------|
| `components/ui/ConfirmDialog.tsx` | 33-37 |

`confirmInput` adalah object — tiap render bikin object baru → useEffect re-run terus.

### 5.11 Image Alt Text Tidak Deskriptif
| File | Baris |
|------|-------|
| `components/layout/Topbar.tsx` | 155 |

`alt="Profile"` — tidak deskriptif untuk accessibility.

### 5.12 Missing 'use client' Directive
| File | Baris |
|------|-------|
| `components/documentation/DocumentationCard.tsx` | 1 |

Component menggunakan hooks/events tapi tidak punya `'use client'`.

### 5.13 AnimatedList Menggunakan Index sebagai Key
| File | Baris |
|------|-------|
| `components/AnimatedList.tsx` | 281 |

`key={index}` — anti-pattern yang bisa sebabkan rendering issues saat list berubah.

---

## 🔴 6. MASALAH SCRIPT, MIGRASI & KONFIGURASI

### 6.1 TLS Certificate Validation Dinonaktifkan
| File | Baris |
|------|-------|
| `migrate.js` | 5 |

```javascript
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';   // ❌ MITM vulnerability!
```
Koneksi database tanpa validasi TLS — rentan man-in-the-middle.

### 6.2 TRUNCATE CASCADE Hapus Data di Luar Target
| File | Baris |
|------|-------|
| `migrate.js` | 91 |

```javascript
await targetClient.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`);
```
`CASCADE` akan truncate **semua** tabel yang punya FK reference — data di tabel tak terkait bisa hilang.

### 6.3 Data Loss Migration — Drop Column Tanpa Backup
| File | Baris |
|------|-------|
| `prisma/migrations/.../migration.sql` | 4-5, 22-24 |

Drop kolom `photoUrl` dan `publicId` dari `documentations` — **semua data existing di kolom tersebut hilang permanen**.

### 6.4 Sync Script Insert Order Tidak Lengkap
| File | Baris |
|------|-------|
| `scripts/full-sync-from-supabase.ts` | 54-62 |

Hanya 6 model, padahal ada 30+ tabel dengan relasi kompleks. Insert out of order → FK violation crash.

### 6.5 Assumsi Model Name = Table Name (LowerCase)
| File | Baris |
|------|-------|
| `scripts/full-sync-from-supabase.ts` | 71 |

`model.toLowerCase()` — tidak semua model pakai lowercase (schema pakai `@@map()`). Error table-not-found.

### 6.6 Missing Content-Security-Policy Header
| File | Baris |
|------|-------|
| `next.config.js` | 64-71 |

Security headers lengkap tapi **tidak ada** `Content-Security-Policy` — critical untuk mencegah XSS.

### 6.7 Pusher Client Missing forceTLS
| File | Baris |
|------|-------|
| `lib/pusher-client.ts` | 6-9 |

WebSocket bisa pakai koneksi tidak terenkripsi karena `forceTLS: true` tidak diset.

### 6.8 `SiswaPencapaian` Model Tidak Ada — Tapi Jadi Relasi di Script
| File | Baris |
|------|-------|
| `scripts/sync-neon.ts` | 39 |

Script sync referensi `siswa_pencapaian` tapi model tidak ada di Prisma schema.

### 6.9 Registration Tables Missing Prisma Relations
| File | Baris |
|------|-------|
| `prisma/schema.prisma` | 701, 719 |

`RegistrationEskul` dan `RegistrationOsisMpk` punya `organization_id` tapi **tidak ada** `@relation` ke `Organization`.

### 6.10 Image URL Column Terlalu Pendek
| File | Baris |
|------|-------|
| `prisma/schema.prisma` | 220 |

`image_url String @db.VarChar(255)` — Cloudinary URLs bisa exceed 255 chars.

### 6.11 Organization Service Missing SUPER_ADMIN Check
| File | Baris |
|------|-------|
| `lib/services/organization-service.ts` | 19 |

```typescript
if (cleanRole === 'administrator')   // ❌ SUPER_ADMIN tidak di-handle
```
User dengan role `SUPER_ADMIN` tidak mendapat akses ke semua organisasi.

### 6.12 Email Template Leak ke Wrong Org
| File | Baris |
|------|-------|
| `lib/services/email-template.service.ts` | 226-230 |

Lookup template email tidak filter by organization — template OSIS bisa terpakai untuk Programming.

### 6.13 `seed.ts` Tidak Ada
| File | Baris |
|------|-------|
| `package.json` | 17 |

Script `db:seed` dan `setup` referensi `scripts/seed.ts` — file **tidak ada**.

---

## 🔴 7. MASALAH KEAMANAN API TAMBAHAN

### 7.1 SSRF via IP Geolocation Lookup
| File | Baris |
|------|-------|
| `app/api/wawancara/antrian/route.ts` | 20 |

```typescript
fetch(`http://ip-api.com/json/${ip}?fields=...`)   // ❌ IP dari header x-forwarded-for
```
Attacker bisa spoof IP dan trigger server request ke ip-api.com dengan IP internal.

### 7.2 IDOR di Flutter Members CRUD
| File | Baris |
|------|-------|
| `app/api/flutter/members/route.ts` | 187-256 (PUT), 259-303 (DELETE) |

Tidak ada pengecekan apakah user memiliki akses ke `organization_id` — user bisa update/hapus anggota dari org lain.

### 7.3 Improper Error Handling — Stack Trace Ekspos
| File | Baris (contoh) |
|------|----------------|
| `app/api/materi/route.ts` | 98-99 |
| `app/api/jadwal/route.ts` | 90-91, 132-133 |
| `app/api/kegiatan/route.ts` | 28-30, 67-69, 100-102 |
| `app/api/dokumentasi/route.ts` | 134-136, 244-246, 309-312 |

Error messages dari database/server dikembalikan langsung ke client — ekspos struktur DB.

### 7.4 Weak Slug Generation — Bisa Manipulasi
| File | Baris |
|------|-------|
| `app/api/organizations/route.ts` | 77 |

```typescript
const slug = nama.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
```
Dua nama bisa hasilkan slug sama. Juga bisa mengandung karakter path traversal.

### 7.5 User Enumeration via Login Response
| File | Baris |
|------|-------|
| `app/api/auth/login/route.ts` | 48, 54, 61 |

Response berbeda untuk email tidak ditemukan vs password salah — attacker bisa enumerasi email valid.

### 7.6 Mass Assignment di Flutter Members Update
| File | Baris |
|------|-------|
| `app/api/flutter/members/route.ts` | 226-231 |

`...parsed.data` — schema includes `organization_id`. Attacker bisa pindahkan anggota ke org lain.

### 7.7 Weak Confirmation Bypass di Clear Database
| File | Baris |
|------|-------|
| `app/api/admin/clear-database/route.ts` | 146-148 |

Konfirmasi `HAPUS ${org.nama.toUpperCase()}` — bisa dimanipulasi dengan karakter khusus.

---

## 📊 RINGKASAN PER KATEGORI (UPDATE)

| Kategori | Jumlah Bug | Tertinggi |
|----------|-----------|-----------|
| INPUT/CREATE | 12 | CRITICAL — registrasi publik role admin |
| READ/OUTPUT | 9 | HIGH — data leakage, ekspor data sensitif |
| UPDATE | 9 | CRITICAL — duplikasi transaksi kas, XP korup |
| DELETE | 9 | CRITICAL — global deletion tanpa filter |
| FRONTEND/UI | 13 | HIGH — password di localStorage, redirect loop |
| SCRIPT/CONFIG | 13 | CRITICAL — TLS disabled, TRUNCATE CASCADE, data loss migration |
| API SECURITY | 7 | CRITICAL — SSRF, IDOR, mass assignment |
| **TOTAL** | **72** | |

---

## ⚡ PRIORITAS PERBAIKAN (UPDATE)

### Segera (Critical)
1. **Hapus endpoint registrasi publik** atau ganti role `ORG_ADMIN` → `USER`
2. **Tambah RBAC** di 3 endpoint anggota/kas/absensi publik
3. **Fix `Pencapaian.id`** — tambah `@default(autoincrement())`
4. **Buat model `siswaPencapaian`** di Prisma schema atau hapus dependensi
5. **Tambah `onDelete: Cascade`** di semua relasi User
6. **Fix duplikasi transaksi kas** — pakai upsert dengan pengecekan tanggal
7. **Fix `updateExp`** — jangan campur aduk `Siswa` ID dengan `Member` ID
8. **Tambah WHERE clause** di `deleteMany()` — jangan global
9. **Jangan simpan password di localStorage** — ganti dengan token
10. **Fix redirect loop** di halaman utama
11. **Aktifkan TLS validation** — hapus `NODE_TLS_REJECT_UNAUTHORIZED=0`
12. **Hapus `CASCADE` berbahaya** di migrate.js
13. **Tambah Content-Security-Policy** di next.config.js
14. **Fix SSRF** — validasi IP sebelum fetch

### Tinggi (High)
- Filter backup clear-database per org
- Fix school year progression
- Rate limiting Flutter auth
- Fix IDOR di Flutter members
- Jangan expose error stack trace ke client
- Fix slug generation
- Fix user enumeration
- Tambah RBAC documentation
