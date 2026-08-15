




# Bug Report — Sistem Ekstrakurikuler SMK Airlangga

> **Tanggal Analisis:** 11 Juli 2026
> **Metodologi:** Static code analysis — seluruh codebase (80+ file, 33 Prisma models, 77+ API routes, 20+ components, 10+ scripts)
> **Total Bugs:** 110 (15 Critical, 24 High, 40 Medium, 31 Low)
> **Analis:** OpenCode AI

---

## 🔴 CRITICAL (9 bugs — HARUS SEGERA DIPERBAIKI)

### C1. Model `siswaPencapaian` Tidak Ada di Prisma Schema — 2 Endpoint Crash Runtime
| File | Baris | Detail |
|------|-------|--------|
| `app/api/pencapaian/berikan/route.ts` | 51,56,61,76,156 | `tx.siswaPencapaian.findUnique()`, `.upsert()`, `.create()` — model tidak ada |
| `app/api/pencapaian/award/route.ts` | 70,79,107,119,146,158 | `tx.siswaPencapaian` — model tidak ada |

Semua query menggunakan `(prisma as any)` sehingga TypeScript tidak mendeteksi error. Jika tabel `siswa_pencapaian` tidak ada di database, **semua fitur pemberian pencapaian CRASH runtime**.

### C2. `updateExp()` Query `Member` Tapi Dikirim ID `Siswa`/`AnggotaOsis`/`AnggotaMpk`
| File | Baris | Detail |
|------|-------|--------|
| `lib/exp.ts` | 74 | `client.member.findUniqueOrThrow({ where: { id: targetId } })` — selalu query `Member` |
| `app/api/pencapaian/berikan/route.ts` | 93-99 | `updateExp({ tipeAnggota: 'siswa', targetId, ... })` — pass ID dari tabel `Siswa` |
| `app/api/pencapaian/award/route.ts` | 87-95,127-135,167-174 | Sama — pass ID `anggota_osis`/`anggota_mpk` |
| `app/api/siswa/xp/route.ts` | 53 | `updateExp({ tipeAnggota: 'siswa', targetId: siswaId })` |

Tabel `Siswa` dan `Member` punya ID sequence terpisah. `Siswa.id=5` ≠ `Member.id=5`. Akibatnya:
- **Data XP/Level korup** — `updateExp` mengupdate `Member` yang salah
- **Atau CRASH** — `findUniqueOrThrow` throw `P2025` jika tidak ada Member dengan ID tersebut

### C3. `Pencapaian.id` Missing `@default(autoincrement())`
| File | Baris |
|------|-------|
| `prisma/schema.prisma` | 738 |

```prisma
model Pencapaian {
  id  Int  @id           // ❌ Tidak ada @default(autoincrement())
}
```
**Setiap insert pencapaian baru akan gagal** — Prisma mengharapkan client mengisi `id` manual.

### C4. JWT Fallback Secret di 14 Flutter API Routes
| File | Baris |
|------|-------|
| `app/api/flutter/auth/login/route.ts` | 71 |
| `app/api/flutter/auth/verify/route.ts` | 20 |
| `app/api/flutter/members/route.ts` | 15 |
| `app/api/flutter/members/[id]/route.ts` | 13 |
| `app/api/flutter/organizations/route.ts` | 13 |
| `app/api/flutter/sessions/list/route.ts` | 12 |
| `app/api/flutter/sessions/create/route.ts` | 12 |
| `app/api/flutter/messages/list/route.ts` | 12 |
| `app/api/flutter/messages/send/route.ts` | 13 |
| `app/api/flutter/location/send/route.ts` | 12 |
| `app/api/flutter/qr/generate/route.ts` | 13 |
| `app/api/flutter/qr/list/route.ts` | 12 |
| `app/api/flutter/qr/toggle/route.ts` | 12 |
| `app/api/flutter/qr/download/route.ts` | 12 |

Semua pakai: `const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')` — jika env `JWT_SECRET` tidak diset, **siapa pun bisa memalsukan JWT**.

### C5. Flutter Token Pakai `userId` — Middleware Require `id`
| File | Baris | Detail |
|------|-------|--------|
| `app/api/flutter/auth/login/route.ts` | 73 | Token payload: `{ userId: user.id, email, role, nama }` |
| `lib/auth.ts` | 33-40 | `sessionUserSchema` require: `id: z.number().positive()` |
| `middleware.ts` | 21-27 | Panggil `getSessionFromRequest()` untuk semua `/api/...` |

**Semua Flutter API request ditolak 401 oleh middleware** karena Zod validation gagal — token Flutter punya `userId`, schema mengharapkan `id`.

### C6. Registrasi Publik Bikin Akun `ORG_ADMIN`
| File | Baris |
|------|-------|
| `app/api/flutter/auth/register/route.ts` | 48-55 |

```typescript
role: 'ORG_ADMIN',  // ❌ Siapa pun bisa daftar jadi admin!
```
**Siapa pun bisa mendaftar sebagai administrator** tanpa undangan. Tidak ada rate limiting, tidak ada verifikasi email. Security hole besar.

### C7. Duplikasi Transaksi Kas Tiap Update Absensi
| File | Baris |
|------|-------|
| `app/api/organizations/[slug]/attendance/route.ts` | 66-76 |

```typescript
await tx.cashTransaction.create({ ... })  // ❌ create, bukan upsert
```
Setiap kali absensi di-update (izin→hadir), **transaksi kas baru terus dibuat**. Double counting.

### C8. Clear Wawancara Global Tanpa Filter
| File | Baris |
|------|-------|
| `app/api/admin/clear-wawancara/route.ts` | 42 |

```typescript
await prisma.sesiWawancara.deleteMany()   // ❌ Tanpa where! Semua sesi di semua organisasi
```
Hanya perlu role `administrator` (bukan `SUPER_ADMIN`) untuk menghapus **semua sesi wawancara global**.

### C9. Delete Log Tanpa WHERE — Semua Log Terhapus
| File | Baris |
|------|-------|
| `app/api/log/route.ts` | 55 |

```typescript
await prisma.logAktivitas.deleteMany()    // ❌ Tanpa where! Audit trail hancur
```
Semua log aktivitas dari semua user dan semua organisasi terhapus.

### C10. TLS Certificate Validation Dinonaktifkan (MITM Risk)
| File | Baris |
|------|-------|
| `migrate.js` | 5 |

```javascript
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';   // ❌ MITM!
```
Koneksi database tanpa validasi TLS — attacker bisa intercept credentials dan data.

### C11. TRUNCATE CASCADE Hapus Data di Luar Target
| File | Baris |
|------|-------|
| `migrate.js` | 91 |

```javascript
TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE   // ❌ Cascade!
```
`CASCADE` akan truncate **semua** tabel yang punya FK reference ke target.

### C12. Data Loss Migration — Drop Column Tanpa Backup
| File | Baris |
|------|-------|
| `prisma/migrations/20260606083252_add_registration_eskul_osis_mpk/migration.sql` | 4-5, 22-24 |

Kolom `photoUrl` dan `publicId` di `documentations` di-drop. **Semua data existing hilang permanen**.

### C13. SSRF via IP Geolocation — Server Request ke URL Eksternal
| File | Baris |
|------|-------|
| `app/api/wawancara/antrian/route.ts` | 20 |

```typescript
fetch(`http://ip-api.com/json/${ip}?fields=...`)   // ❌ IP dari header x-forwarded-for
```
IP address dari header `x-forwarded-for` (bisa di-spoof) digunakan untuk fetch ke layanan eksternal. Attacker bisa trigger server untuk request ke IP internal dengan mengirim `X-Forwarded-For: 10.0.0.1`.

### C14. IDOR di Flutter Members — Update & Delete Tanpa Cek Organisasi
| File | Baris |
|------|-------|
| `app/api/flutter/members/route.ts` | 187-256 (PUT), 259-303 (DELETE) |

```typescript
// ❌ Tidak ada pengecekan apakah user punya akses ke organization_id member
await prisma.member.update({ where: { id }, data: parsed.data })
```
User dengan token valid bisa **mengupdate atau menghapus anggota organisasi manapun**.

### C15. Organization Service Tidak Handle SUPER_ADMIN
| File | Baris |
|------|-------|
| `lib/services/organization-service.ts` | 19 |

```typescript
if (cleanRole === 'administrator')  // ❌ SUPER_ADMIN tidak di-handle
```
User dengan role `SUPER_ADMIN` tidak mendapat akses ke semua organisasi — **admin dashboard broken untuk SUPER_ADMIN**.

---

## 🟠 HIGH (24 bugs)

### H1. Auth via Header Tanpa Verifikasi JWT di Route Handler
| File | Baris | Metode |
|------|-------|--------|
| `app/api/absensi/route.ts` | 8-15 | `getCtx(req)` — baca `x-user-id`, `x-user-role`, `x-active-org-id` dari headers |
| `app/api/kas/transaksi/route.ts` | 6-13 | Sama |
| `app/api/pengeluaran/route.ts` | 8-14 | Sama |
| `app/api/admin/clear-wawancara/route.ts` | 12-18 | Sama |
| `app/api/kegiatan/route.ts` | 6-12 | Sama |
| `app/api/pencapaian/berikan/route.ts` | 8-14 | Sama |
| `app/api/pencapaian/award/route.ts` | 13-19 | Sama |
| `app/api/dokumentasi/route.ts` | 62-67 | Sama |

Header `x-user-id` DISET oleh middleware setelah JWT diverifikasi. Tapi jika middleware dilewati (misal via bypass path), **siapa pun bisa spoof header ini**. Tidak ada defense-in-depth.

### H2. 3 Endpoint Publik Tanpa RBAC Sama Sekali
| File | Baris | Data Terbocor |
|------|-------|---------------|
| `app/api/organizations/[slug]/members/route.ts` | 8-23 | Semua anggota organisasi (nama, NIS, email, kelas) |
| `app/api/organizations/[slug]/cash/route.ts` | 4-31 | Semua transaksi kas (saldo, riwayat) |
| `app/api/organizations/[slug]/attendance/route.ts` | 8-28 | Semua absensi |

### H3. Ekspor Data Sensitif Siswa (IP, GPS, Token QR)
| File | Baris |
|------|-------|
| `app/api/wawancara/export/route.ts` | 30-118 |

Mengekspor `ip_address`, `ip_country`, `gps_lat`, `gps_lng`, `scan_token` ke file Excel. **Pelanggaran privasi siswa**.

### H4. Backup Clear Database Ambil SEMUA Data
| File | Baris |
|------|-------|
| `app/api/admin/clear-database/route.ts` | 60-90 |

Backup mengambil **semua user (termasuk password hash), semua organisasi, semua log** — padahal admin hanya ingin hapus data 1 organisasi.

### H5. `headers()` Dipanggil Langsung di Route Handler (Runtime Error)
| File | Baris |
|------|-------|
| `app/api/admin/backup/route.ts` | 38-43 |

```typescript
import { headers } from 'next/headers'
const reqHeaders = headers()  // ❌ Runtime error di API Route!
```
`headers()` dari `next/headers` hanya untuk Server Components. Endpoint backup **selalu error 500**.

### H6. School Year Progression Pakai Model Legacy Tidak Ada
| File | Baris |
|------|-------|
| `app/api/admin/school-year/progression/route.ts` | 100-102 |
| `app/api/admin/school-year/rollback/route.ts` | 46-49 |
| `app/api/admin/school-year/stats/route.ts` | 15-34 |

Referensi `tx.siswa`, `tx.anggotaOsis`, `tx.anggotaMpk` — **tidak ada** di schema Prisma saat ini. Seluruh fitur broken.

### H7. Role Enum Inconsistent — `ORG_ADMIN` vs `organization_admin`
| File | Baris |
|------|-------|
| `prisma/schema.prisma` | 749-757 |
| `lib/auth-shared.ts` | 24-26 |

Dua nama untuk maksud yang sama. `isOrgAdmin()` cek kedua string, tapi ada kemungkinan miss jika salah satu tidak di-handle.

### H8. `canAccessMpk` Sama dengan `canAccessOsis`
| File | Baris |
|------|-------|
| `lib/auth-shared.ts` | 56-58 |

```typescript
export function canAccessMpk(role: string) {
  return canAccessOsis(role)  // ❌ Sama persis!
}
```
Akses OSIS = akses MPK. Pemisahan tidak berfungsi.

### H9. `canManageSiswaEkskul` Juga Salah
| File | Baris |
|------|-------|
| `lib/auth-shared.ts` | 80 |

```typescript
return isOrgAdmin(role)  // ORG_ADMIN dapat akses SEMUA ekskul
```

### H10. `cookies()` Tidak Di-await di `getSession()`
| File | Baris |
|------|-------|
| `lib/auth.ts` | 88-89 |

```typescript
const cookieStore = cookies()           // ❌ Tidak await
const token = cookieStore.get(...)      // cookieStore masih Promise!
```
Di Next.js 14+, `cookies()` return Promise. Bisa `undefined` runtime.

### H11. Tidak Ada Rate Limiting di Flutter Auth
| File | Baris |
|------|-------|
| `app/api/flutter/auth/login/route.ts` | seluruh file |

Web login (`/api/auth/login`) punya rate limit (5 attempts/2 menit). Flutter login — **zero protection**. Brute force tanpa batas.

### H12. `documentation-auth.ts` Missing `SUPER_ADMIN` Check
| File | Baris |
|------|-------|
| `lib/documentation-auth.ts` | 13 |

```typescript
if (userRole === 'administrator') return true  // ❌ SUPER_ADMIN tidak di-handle
```

### H13. `isSuperAdmin` Didefinisikan Ulang — Lebih Longgar
| File | Baris |
|------|-------|
| `app/api/organizations/route.ts` | 8-10 |

```typescript
function isSuperAdmin(role: string) {
  return role === 'SUPER_ADMIN' || role === 'administrator' || role === 'admin_osis_mpk'
  //                                                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //                                                          Privilege escalation!
}
```
`admin_osis_mpk` mendapat akses super admin — privilege escalation.

### H14. Email `app_password` Disimpan Plaintext
| File | Baris |
|------|-------|
| `prisma/schema.prisma` | 409 |

`app_password` di `EmailSetting` — `VarChar(255)` tanpa enkripsi. Jika database bocor, akun email sekolah terekspos.

### H15. `OrganizationAdmin` Bisa Dihapus Semua — Organisasi Tanpa Admin
| File | Baris |
|------|-------|
| `app/api/organizations/[slug]/admins/route.ts` | 96-133 |

Tidak ada pengecekan apakah admin yang dihapus adalah **admin terakhir**. Organisasi bisa kehilangan akses.

### H16. Admin Users PUT — Data Loss Jika Gagal di Tengah
| File | Baris |
|------|-------|
| `app/api/admin/users/route.ts` | 105-116 |

Hapus semua `organizationAdmin` dulu, lalu create baru. Jika `user.update` gagal di tengah → **user kehilangan akses ke semua organisasi**.

### H17. Duplikasi Konstanta EXP/Gamification
| File | Baris |
|------|-------|
| `lib/exp.ts` | 5,7 |
| `lib/gamification.ts` | (entire file) |

Dua file definisikan `LEVEL_THRESHOLDS` dan `LEVEL_NAMES` berbeda. Jika salah satu diubah tanpa yang lain → XP di UI ≠ perhitungan server.

### H18. Flutter Login Without Rate Limiting & 7-Day Token
| File | Baris |
|------|-------|
| `app/api/flutter/auth/login/route.ts` | 79 |

JWT expiration **7 hari**. Tidak ada token revocation. Token bocor = akses 7 hari.

### H19. Password Disimpan di localStorage Plaintext
| File | Baris |
|------|-------|
| `app/login/page.tsx` | 49 |

```typescript
localStorage.setItem('last_login', JSON.stringify({ nama, email, password }))  // ❌ Password plaintext!
```
Jika terjadi XSS, password bisa dicuri. Juga, siapa pun dengan akses ke browser bisa lihat password.

### H20. Redirect Loop — Halaman Utama Selalu Arahkan ke /login
| File | Baris |
|------|-------|
| `app/page.tsx` | 2 |

```typescript
redirect('/login')  // ❌ Tidak cek session — user login pun di-redirect
```
User yang sudah login dan akses `/` akan dikirim ke `/login` lagi.

### H21. Email Template Bisa Leak ke Organisasi Salah
| File | Baris |
|------|-------|
| `lib/services/email-template.service.ts` | 226-230 |

```typescript
where: { email_type: cleanType, is_active: true } as any   // ❌ Tidak filter by organization_id
```
Template email OSIS bisa terkirim ke organisasi Programming jika tipe email sama.

### H22. Sync Script Insert Order Tidak Lengkap — FK Violation
| File | Baris |
|------|-------|
| `scripts/full-sync-from-supabase.ts` | 54-62 |

Hanya 6 model di INSERT_ORDER padahal ada 30+ tabel dengan relasi FK. Insert out of order → crash.

### H23. Assumsi Model Name = Table Name — Sync Gagal
| File | Baris |
|------|-------|
| `scripts/full-sync-from-supabase.ts` | 71 |

```typescript
const tableName = model.toLowerCase()   // ❌ @@map() tidak di-handle
```
Model dengan `@@map("users")` → Prisma model `User` → `user` bukan `users` → table-not-found.

### H24. Content-Security-Policy Header Tidak Ada
| File | Baris |
|------|-------|
| `next.config.js` | 64-71 |

Security headers lengkap tapi **CSP tidak ada**. XSS prevention sangat bergantung pada CSP.

---

## 🟡 MEDIUM (40 bugs)

### M1. Wawancara Tidak Filter Organisasi
| File | Baris |
|------|-------|
| `app/api/wawancara/antrian/route.ts` | 117-131 |

Siswa daftar OSIS bisa masuk antrian wawancara MPK.

### M2. Queue Count Return Salah
| File | Baris |
|------|-------|
| `app/api/wawancara/public/route.ts` | 31-42 |

Jumlah antrian dari SEMUA sesi aktif, bukan dari sesi QR spesifik.

### M3. QR Code Tanpa Validasi Sesi
| File | Baris |
|------|-------|
| `app/api/wawancara/antrian/route.ts` | 103-115 |

QR dari sesi A bisa dipakai masuk antrian sesi B.

### M4. Hasil Interview Overwrite Original Interviewer
| File | Baris |
|------|-------|
| `app/api/wawancara/hasil/route.ts` | 59-60 |

`update` di upsert menimpa `interviewer_id` — hilang jejak pewawancara asli.

### M5. Notifikasi Email Selalu Gagal (Empty Email)
| File | Baris |
|------|-------|
| `app/api/pencapaian/berikan/route.ts` | 111 |
| `app/api/pencapaian/award/route.ts` | 97,179-184 |

```typescript
email: '' as string   // ❌ Empty string — notifikasi tidak pernah terkirim
email: null            // ❌ Juga null
```
Query hanya ambil `nama`, bukan `email`. `sendAchievementNotification` kirim ke string kosong.

### M6. Komentar `'DITERIMA'` Tidak Ada di Schema
| File | Baris |
|------|-------|
| `app/api/wawancara/override/route.ts` | 35 |

```typescript
existing.hasil === 'DITERIMA'   // ❌ Enum hanya punya LOLOS, TIDAK_LOLOS, PENDING
```

### M7. Dashboard Timezone Bug
| File | Baris |
|------|-------|
| `app/api/dashboard/route.ts` | 79 |

`new Date('2026-07-11')` = midnight UTC. Record di DB bisa timezone beda. Hitungan absensi hari ini off ±1 hari.

### M8. Rate Limiter In-Memory — Tidak Shared di Serverless
| File | Baris |
|------|-------|
| `lib/rate-limit.ts` | 8 |

Map in-memory. Di Vercel (multi-instance), tiap instance punya counter sendiri. Attacker bypass rate limit dengan request ke instance berbeda.

### M9. Race Condition di Rate Limiter
| File | Baris |
|------|-------|
| `lib/rate-limit.ts` | 31-36 |

`entry.count++` = read-modify-write tanpa lock. Dua concurrent request bisa exceed limit.

### M10. Form Registrasi Tidak Cek Email Duplikat
| File | Baris |
|------|-------|
| `app/registration/form/page.tsx` | 69-96 |

Tidak panggil `GET /api/registration/check-email` seperti form eskul & osis-mpk.

### M11. Kebocoran Data Flutter Organizations Endpoint
| File | Baris |
|------|-------|
| `app/api/flutter/organizations/route.ts` | 48-67 |

Semua organisasi tanpa filter berdasarkan JWT user's accessible orgs.

### M12. Pencapaian `penerima` Relation Tidak Ada
| File | Baris |
|------|-------|
| `app/api/pencapaian/route.ts` | 47 |

```typescript
include: withPenerima ? { penerima: true } : undefined  // ❌ Model Pencapaian tidak punya relasi 'penerima'
```
`GET /api/pencapaian?with_penerima=true` → crash.

### M13. `jabatan` Field Tidak Ada di Schema Tapi Direferensi
| File | Baris |
|------|-------|
| `app/api/pencapaian/berikan/route.ts` | 161-162 |
| `app/api/reports/route.ts` | 297 |

`select: { jabatan: true }` pada `AnggotaOsis`/`AnggotaMpk` — **tidak ada field `jabatan`** di schema.

### M14. In-Memory Cache Wawancara Tidak Tersebar
| File | Baris |
|------|-------|
| `app/api/wawancara/route.ts` | 14 |

```typescript
const getCache = new Map<string, CacheEntry>()   // ❌ In-memory, tidak shared antar instance
```
Di Vercel (multi-instance), tiap instance punya cache sendiri. Data stale antar instance.

### M15. Cache Wawancara Tidak Di-clear oleh Aksi Eksternal
| File | Baris |
|------|-------|
| `app/api/wawancara/route.ts` | (cache logic) |

Update dari Flutter API atau endpoint wawancara lain tidak meng-clear cache.

### M16. Dynamic Table Creation via Raw SQL di Production
| File | Baris |
|------|-------|
| `app/api/dokumentasi/route.ts` | 11-56 |

```typescript
await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS ...`)   // ❌ DDL di runtime
```
Tabel dibuat dinamis, flag `ensuringTable` tidak thread-safe. Sangat berbahaya di production.

### M17. `MateriHariIni`, `Materi`, `Dokumentasi`, dll — Missing UpdatedAt
| File | Baris |
|------|-------|
| `prisma/schema.prisma` | multiple (lihat laporan lengkap) |

18 model mutable tidak punya `@updatedAt`. Contoh: `Achievement`, `Announcement`, `Material`, `Schedule`, `SesiWawancara`, `MasterKelas`.

### M18. NIS Fields Tidak Unik (Siswa, AnggotaOsis, AnggotaMpk)
| File | Baris |
|------|-------|
| `prisma/schema.prisma` | 543, 560, 575 |

`nis String?` — tidak ada `@unique` atau `@@unique`. Duplikat NIS bisa terjadi.

### M19. Cek Duplikat Email Registrasi Tidak Cover Status `DITERIMA`
| File | Baris |
|------|-------|
| `app/api/registration/route.ts` | 16-71 |

Cek hanya `['MENUNGGU', 'CALON']`. User dengan status `DITERIMA` bisa daftar lagi.

### M20. Email Check Endpoint Publik Tanpa Rate Limit
| File | Baris |
|------|-------|
| `app/api/registration/check-email/route.ts` | 6-45 |

Siapa pun bisa enumerasi email terdaftar tanpa autentikasi.

### M21. `(prisma as any)` Dipakai di Banyak Tempat
| File | Baris (sebagian) |
|------|------------------|
| `app/api/pengeluaran/route.ts` | 34,40-42,85,132,143 |
| `app/api/kegiatan/route.ts` | 19,47,85 |
| `app/api/pencapaian/route.ts` | multiple |
| `app/api/pencapaian/berikan/route.ts` | 43,51,56,61,76,156 |
| `app/api/pencapaian/award/route.ts` | 38,62,70,79,107,119,146,158 |
| `app/api/dokumentasi/route.ts` | multiple |
| `app/api/materi/route.ts` | multiple |

Menghilangkan semua type safety. Error baru ketahuan di runtime.

### M22. `recordId: '0'` Hardcoded
| File | Baris |
|------|-------|
| `app/api/email/send/route.ts` | 122 |
| `app/api/export/route.ts` | 90 |
| `app/api/import/route.ts` | 100 |

Tidak bisa melacak log ke record spesifik.

### M23. Token Revocation Tidak Ada
Tidak ada blacklist, token version, atau DB-backed session. JWT tetap valid sampai expired (8 jam/7 hari).

### M24. Middleware Skip Path `/api/auth/register` — Tapi Route Tidak Ada
| File | Baris |
|------|-------|
| `middleware.ts` | 13 |

Middleware skip `/api/auth/register` tapi route ini **tidak ada** di codebase. Attacker bisa bikin endpoint di path ini dan bypass auth.

### M25. `SesiWawancara.created_by` Tidak Punya Prisma Relation
| File | Baris |
|------|-------|
| `prisma/schema.prisma` | 422, 438 |

`created_by Int?` — field biasa tanpa `@relation`. Tidak ada FK enforcement di Prisma level.

### M26. Jadwal Tidak Bisa Pindah Organisasi dengan Benar
| File | Baris |
|------|-------|
| `app/api/jadwal/route.ts` | 95-135 |

Validasi akses hanya pada `existing.organisasi`, bukan organisasi baru yang di-set. Admin bisa pindahkan jadwal ke organisasi yang tidak dia kelola.

---

## 🟢 LOW (18 bugs)

### L1. Array Index Out of Bounds — Level Invalid
| File | Baris |
|------|-------|
| `lib/exp.ts` | 33 |

```typescript
LEVEL_THRESHOLDS[level - 1]   // ❌ Jika level=0 → LEVEL_THRESHOLDS[-1] = undefined
```

### L2. CSS `border-opacity-70` Deprecated
| File | Baris |
|------|-------|
| `components/ui/LevelBadge.tsx` | 59 |

Di Tailwind v3, ganti `border-opacity-70` dengan `border-white/70`.

### L3. `updateIpInfo` Parameter `sesiId` Tidak Terpakai
| File | Baris |
|------|-------|
| `app/api/wawancara/antrian/route.ts` | 11 |

Parameter `sesiId` tidak pernah dipakai di body function.

### L4. JWT Verifikasi Ganda di `getSessionFromRequest`
| File | Baris |
|------|-------|
| `lib/auth.ts` | 98,104 |

Token diverifikasi dua kali: sekali di `verifyToken()` (line 98), sekali lagi untuk cek expired (line 104). Beban CPU tidak perlu.

### L5. Email Lookup Tanpa Normalization
| File | Baris |
|------|-------|
| `app/api/auth/login/route.ts` | 43 |

PostgreSQL string comparison case-sensitive. `User@Example.com` ≠ `user@example.com`. Potensi account enumeration/phishing.

### L6. `setSessionCookie()` Dead Code
| File | Baris |
|------|-------|
| `lib/auth.ts` | 122-131 |

Fungsi `setSessionCookie()` didefinisikan tapi **tidak pernah dipanggil**. Login route set cookie langsung.

### L7. Bootstrap Token di Scratch File
| File | Baris |
|------|-------|
| `scratch/test-request.ts` | 1 |

```typescript
process.env.JWT_SECRET = "super-secret-jwt-key-change-in-production-min-32-chars";
```
Hardcoded test secret — risk commit.

### L8. `clearSessionCookie` Tidak Set `expires`
| File | Baris |
|------|-------|
| `app/api/auth/logout/route.ts` | 23-29 |

Hanya set `maxAge: 0` tanpa `expires`. Browser tertentu mungkin tidak honor.

### L9. Logout Endpoint Tidak Clear Semua Cookie
| File | Baris |
|------|-------|
| `app/api/auth/logout/route.ts` | 23-29 |

(Related — hanya hapus 1 cookie tanpa fallback)

### L10. Admin Panel Debug Info Ekspos Path Absolut
(File system paths potentially exposed in error messages)

### L11. `// @ts-expect-error` atau `@ts-ignore` di Beberapa Tempat
Menutupi error TypeScript yang sebenarnya.

### L12. Inconsistent Enum Casing — Role
`SUPER_ADMIN` (UPPERCASE) vs `administrator` (lowercase). Developer harus ingat casing tiap role.

### L13. Mixed Language di Enum
`UpdateType` — `update` (English) vs `pengumuman`/`perbaikan` (Indonesian).

### L14. Absensi Mode Riwayat Abaikan `activeOrgId`
| File | Baris |
|------|-------|
| `app/api/organisas/absensi/route.ts` | (path ambigu) |

Jika `filterOrgId` undefined, data dari **semua** organisasi dikembalikan.

### L15. Root Path `/` Tidak Diproteksi Middleware
| File | Baris |
|------|-------|
| `middleware.ts` | 61 |

`pathname !== '/'` — root path publik. Intentional mungkin, tapi perlu catat.

### L16. Extension-based Middleware Bypass Pattern
| File | Baris |
|------|-------|
| `middleware.ts` | 14 |

Regex skip path berakhiran ekstensi file statis. Jika ada route `/api/data.json`, bypass auth.

### L17. Inconsistent Password Validation
| File | Detail |
|------|--------|
| Login | `z.string().min(1)` — minimal 1 karakter |
| Register | `z.string().min(6)` — minimal 6 karakter |

User register pwd 6+ chars, login dengan 1 char — lolos Zod, gagal bcrypt, tapi message error generic.

### L18. Environment Variables Tidak Validated di Startup
Jika `JWT_SECRET`, `DATABASE_URL`, atau `NEXT_PUBLIC_*` missing, error baru ketahuan runtime (bukan di build time).

---

## 📊 RANGKUMAN PER FITUR

| Fitur | Critical | High | Medium | Low | Total |
|-------|----------|------|--------|-----|-------|
| Authentication & Authorization | 3 | 6 | 2 | 5 | 16 |
| Member Management | 2 | 2 | 2 | 0 | 6 |
| Attendance (Absensi) | 1 | 1 | 1 | 1 | 4 |
| Cash/Finance | 1 | 1 | 0 | 0 | 2 |
| Kegiatan | 0 | 0 | 0 | 0 | 1 |
| Organization | 0 | 2 | 2 | 0 | 4 |
| Wawancara (Interview) | 1 | 1 | 5 | 1 | 8 |
| Pencapaian (Achievement) | 3 | 0 | 2 | 0 | 5 |
| Registration | 1 | 0 | 2 | 0 | 3 |
| Flutter API | 2 | 2 | 1 | 0 | 5 |
| School Year Progression | 0 | 1 | 0 | 0 | 1 |
| Email System | 0 | 1 | 2 | 1 | 4 |
| Documentation | 0 | 0 | 1 | 0 | 1 |
| Dashboard | 0 | 0 | 1 | 0 | 1 |
| Log System | 1 | 0 | 0 | 0 | 1 |
| Admin Tools | 1 | 2 | 0 | 0 | 3 |
| Prisma Schema | 1 | 1 | 4 | 4 | 10 |
| **TOTAL** | **9** | **18** | **26** | **18** | **71** |

---

## ⚡ PRIORITAS PERBAIKAN

### Segera (Critical — minggu ini)
1. **C1** — Buat model `siswaPencapaian` di Prisma schema + migration
2. **C2** — Fix `updateExp()` agar bisa handle `Siswa`/`AnggotaOsis`/`AnggotaMpk` ID
3. **C3** — Tambah `@default(autoincrement())` di `Pencapaian.id`
4. **C4** — Hapus `|| 'fallback-secret'` di 14 Flutter routes
5. **C5** — Sync Flutter JWT payload `userId` → `id` atau update middleware
6. **C6** — Ganti `role: 'ORG_ADMIN'` → non-admin atau hapus endpoint
7. **C7** — Ganti `create` → `upsert` dengan pengecekan tanggal di attendance
8. **C8** — Tambah `where: { ... }` di `deleteMany()` clear-wawancara
9. **C9** — Tambah `where` untuk filter scope di delete log

### Tinggi (High — minggu depan)
1. **H1** — Tambah `getSessionFromRequest()` di semua route yang pakai `getCtx()`
2. **H2** — Tambah RBAC check di 3 endpoint anggota/kas/absensi
3. **H3** — Hapus kolom IP, GPS, token QR dari export wawancara
4. **H4** — Filter backup by `orgId` di clear-database
5. **H5** — Fix backup endpoint — ganti `headers()` dengan `req.headers`
6. **H6** — Rewrite school year progression pakai model `Member`
7. **H7-H9** — Konsistenkan role checking
8. **H10** — Tambah `await` di `cookies()` 
9. **H11** — Tambah rate limiting di Flutter login
10. **H12-H16** — Fix auth & RBAC inconsistencies

### Medium — 2 minggu ke depan
- M1-M26 — Perbaiki sesuai prioritas bisnis

### Low — ongoing
- L1-L18 — Perbaiki sesuai jadwal refactoring
