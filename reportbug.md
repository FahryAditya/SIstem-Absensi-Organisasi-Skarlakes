# Bug Report — Sistem Ekstrakurikuler

> **Tanggal Analisis:** 11 Juli 2026
> **Metodologi:** Static code analysis (seluruh codebase)

---

## 🔴 CRITICAL (Harus segera diperbaiki)

### C1. Auth Bypass via HTTP Headers — 4 endpoint utama tanpa verifikasi JWT

| File | Line | Deskripsi |
|------|------|-----------|
| `app/api/absensi/route.ts` | 8-15 | `getCtx()` membaca `x-user-id`, `x-user-role`, `x-active-org-id` dari headers — **tanpa verifikasi JWT** |
| `app/api/kas/transaksi/route.ts` | 6-13 | Sama — **tidak ada** `getSessionFromRequest()` di POST maupun GET |
| `app/api/pengeluaran/route.ts` | 8-14 | Sama — ke-3 method (GET/POST/DELETE) hanya pakai headers |
| `app/api/admin/clear-wawancara/route.ts` | 12-18 | Sama — pake header `x-user-role` tanpa validasi JWT |

**Dampak:** Siapa pun bisa set header `x-user-role: SUPER_ADMIN` dan mendapatkan akses penuh ke:
- Manajemen absensi, kas, pengeluaran
- Menghapus seluruh data wawancara
- Semua data sensitif organisasi

**Fix:** Ganti `getCtx()` dengan `getSessionFromRequest(req)` di setiap endpoint.

---

### C2. No Auth Sama Sekali — 3 endpoint publik tanpa autentikasi

| File | Line | Deskripsi |
|------|------|-----------|
| `app/api/organizations/[slug]/members/route.ts` | 8-22 | GET endpoint **tanpa** session check. Siapa pun bisa lihat semua anggota organisasi |
| `app/api/organizations/[slug]/cash/route.ts` | 4-32 | GET endpoint **tanpa** session check. Semua data kas terekspos |
| `app/api/organizations/[slug]/attendance/route.ts` | 8-28 | GET endpoint **tanpa** session check. Data absensi publik |

**Dampak:** Eksposur data total — nama anggota, NIS, email, saldo kas, riwayat absensi bisa diakses tanpa login.

**Fix:** Tambahkan `getSessionFromRequest(req)` + RBAC check di setiap endpoint.

---

### C3. Hardcoded JWT Fallback Secret (Flutter API)

**File:** `app/api/flutter/auth/login/route.ts:71`

```typescript
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
```

**Dampak:** Jika env `JWT_SECRET` tidak diset, siapa pun bisa memalsukan token JWT dengan secret `'fallback-secret'` yang ada di source code. Full akses ke semua Flutter API endpoints.

**Fix:** Hapus fallback. Wajibkan `JWT_SECRET` di-set atau throw error.

---

### C4. `headers()` Dipanggil di API Route Handler (Runtime Error)

**File:** `app/api/admin/backup/route.ts:38-43`

```typescript
import { headers } from 'next/headers'
export async function GET() {
  const reqHeaders = headers()  // ❌ Akan throw error!
```

**Dampak:** Endpoint backup **selalu error 500 runtime**. `headers()` dari `next/headers` hanya untuk Server Components, bukan API Route Handler.

**Fix:** Gunakan parameter `req: NextRequest` dan `req.headers.get('x-user-role')`.

---

### C5. School Year Progression Pakai Model Legacy yang Tidak Ada

**File:** `app/api/admin/school-year/progression/route.ts:100-102`
**File:** `app/api/admin/school-year/rollback/route.ts:46-49`
**File:** `app/api/admin/school-year/stats/route.ts:15-34`

```typescript
await processStudents(tx.siswa, 'SISWA')       // ❌ Tidak ada di schema
await processStudents(tx.anggotaOsis, 'OSIS')    // ❌ Tidak ada
await processStudents(tx.anggotaMpk, 'MPK')      // ❌ Tidak ada
```

**Dampak:** Fitur kenaikan kelas (school year progression), rollback, dan stats **seluruhnya broken** — akan throw `PrismaClientValidationError`.

**Fix:** Rewrite menggunakan model `member` yang sesuai dengan schema saat ini.

---

### C6. Duplikasi Transaksi Kas di Setiap Update Absensi

**File:** `app/api/organizations/[slug]/attendance/route.ts:66-76`

```typescript
if (cash_amount > 0) {
  await tx.cashTransaction.create({  // ❌ create, bukan upsert
    data: {
      organization_id: org.id,
      member_id,
      amount: cash_amount,
      type: 'INCOME',
      description: `Iuran Kas via Absensi (${date})`
    }
  })
}
```

**Dampak:** Setiap kali absensi di-update (misal dari izin → hadir), **transaksi kas baru terus dibuat**. Total kas menjadi tidak akurat (double counting).

**Fix:** Cek dulu apakah transaksi untuk member+date tersebut sudah ada, baru create jika belum. Bandingkan dengan implementasi di `app/api/absensi/route.ts:178-209`.

---

### C7. Public Registration Membuat Akun Admin Sembarangan

**File:** `app/api/flutter/auth/register/route.ts:48-55`

```typescript
const user = await prisma.user.create({
  data: {
    email, nama, password: hashedPassword,
    role: 'ORG_ADMIN',  // ❌ Siapa pun bisa daftar jadi admin!
  }
})
// ❌ Tidak ada OrganizationAdmin record dibuat
```

**Dampak:** Siapa pun bisa mendaftar sebagai administrator tanpa undangan. Akun yang dibuat tidak memiliki akses ke organisasi mana pun. Ini adalah **security hole** besar.

**Fix:** Hapus public registration endpoint. Gunakan invitation-only flow dengan validasi.

---

### C8. Clear Database Backup Tidak Filter by Org — Semua Data Kebocor

**File:** `app/api/admin/clear-database/route.ts:60-90`

```typescript
const [users, organizations, organization_admins, members, attendance, ...] = await Promise.all([
  prisma.user.findMany(),       // ❌ Ambil SEMUA user
  prisma.organization.findMany(), // ❌ Ambil SEMUA organisasi
  ...
])
// Backup dikembalikan ke response: content: backupResult.content
```

**Dampak:** Admin yang membersihkan data untuk satu organisasi malah menerima backup **seluruh database** termasuk user, password hash, dan data organisasi lain.

**Fix:** Filter semua query berdasarkan `orgId`.

---

## 🟠 HIGH

### H1. Inconsistent Role Naming — `isOrgAdmin` vs `getAccessibleOrgs`

**File:** `lib/auth-shared.ts:24-26, 42-49`

```typescript
export function isOrgAdmin(role: string) {
  return role === 'ORG_ADMIN' || role === 'organization_admin' || isSuperAdmin(role)
  //          ^^^^^^^^^^^                                  ^^^^^^^^^^^^^^^^^^^^
  //          Tidak konsisten! Dua nama berbeda untuk role yang sama
}

export function getAccessibleOrgs(role: string): string[] {
  if (r === 'ORG_ADMIN' || r === 'organization_admin') return [...]
}
```

**Masalah:** Prisma enum mendefinisikan `organization_admin` tapi ada juga yang pakai `ORG_ADMIN`. Dua string berbeda untuk maksud yang sama. Ketidakcocokan menyebabkan akses ditolak untuk role yang seharusnya valid.

---

### H2. `canAccessMpk` Salah Delegasi ke `canAccessOsis`

**File:** `lib/auth-shared.ts:56-58`

```typescript
export function canAccessMpk(role: string) {
  return canAccessOsis(role)  // ❌ Harusnya punya logic sendiri
}
```

**Dampak:** User dengan akses OSIS otomatis dapat akses MPK dan sebaliknya. Pemisahan akses OSIS/MPK tidak berfungsi.

---

### H3. Duplikasi Konstanta EXP/Gamification — Bisa Drift

**File:** `lib/exp.ts` dan `lib/gamification.ts`

Keduanya mendefinisikan `LEVEL_THRESHOLDS` dan `LEVEL_NAMES` dengan nilai identik tapi API berbeda. Jika suatu saat salah satu diubah tanpa mengubah yang lain, XP di UI tidak akan cocok dengan perhitungan server.

---

### H4. LogAktivitas Tidak Punya `onDelete: Cascade`

**File:** `prisma/schema.prisma:189`

Relasi `LogAktivitas` → `User` tanpa `onDelete: Cascade` atau `SetNull`. **Tidak bisa menghapus user** karena FK violation.

---

### H5. Email `app_password` Disimpan Plaintext

**File:** `prisma/schema.prisma:409`

`app_password` di model `EmailSetting` disimpan sebagai `VarChar(255)` biasa tanpa enkripsi. Jika database bocor, attacker dapat akses akun email sekolah.

---

### H6. Clear Wawancara Menghapus SEMUA Sesi (Global)

**File:** `app/api/admin/clear-wawancara/route.ts:42`

```typescript
const deleted = await prisma.sesiWawancara.deleteMany()  // ❌ Tanpa where!
```

**Dampak:** Admin mana pun (bukan hanya SUPER_ADMIN, `isAdministrator` mencakup `administrator`) bisa menghapus **semua** sesi wawancara di seluruh organisasi.

---

### H7. Pencapaian Tidak Punya Auto-Increment ID

**File:** `prisma/schema.prisma:738`

```prisma
model Pencapaian {
  id  Int    @id           // ❌ Tidak ada @default(autoincrement())
  ...
}
```

**Dampak:** Insert baru gagal karena harus manual set ID.

---

### H8. Dual Member/Attendance System — Data Terfragmentasi

Schema punya **dua set** model: baru (`Member`/`Attendance`/`CashTransaction`) dan legacy (`Siswa`/`AnggotaOsis`/`AnggotaMpk`/`Absensi`/`AbsensiOrganisasi`). Tidak ada migrasi data. Pengeluaran, import Excel, dan school year progression masih pakai legacy models.

---

### H9. `isSuperAdmin` Didefinisikan Ulang dengan Makna Berbeda

**File:** `app/api/organizations/route.ts:8-10`

```typescript
function isSuperAdmin(role: string) {
  return role === 'SUPER_ADMIN' || role === 'administrator' || role === 'admin_osis_mpk'
  //                                                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //                                                          ❌ Tidak sama dengan definisi di auth-shared.ts
}
```

`admin_osis_mpk` mendapatkan akses penuh CRUD organisasi — privilege escalation.

---

### H10. Admin Users PUT Bisa Hapus Associations User Jika Gagal

**File:** `app/api/admin/users/route.ts:105-116`

Pertama hapus semua `organizationAdmin`, lalu create baru. Jika `user.update` gagal di tengah, user kehilangan akses ke semua organisasi tanpa bisa dikembalikan.

---

## 🟡 MEDIUM

### M1. Wawancara Tidak Filter Organisasi yang Tepat — `app/api/wawancara/antrian/route.ts:117-131`

Siswa yang mendaftar OSIS bisa masuk antrian wawancara MPK karena filter `organisasi_type` tidak diterapkan.

### M2. Queue Count Return Salah di Public Endpoint — `app/api/wawancara/public/route.ts:31-42`

Menjumlahkan antrian dari SEMUA sesi aktif, bukan hanya sesi spesifik dari QR code yang di-scan.

### M3. QR Code Tidak Validasi Sesinya — `app/api/wawancara/antrian/route.ts:103-115`

QR dari sesi A bisa dipakai untuk masuk antrian sesi B.

### M4. Hasil Interview Overwrite Original Interviewer — `app/api/wawancara/hasil/route.ts:59-60`

`update` di upsert menimpa `interviewer_id` dengan user yang sedang melakukan edit. Hilang jejak pewawancara asli.

### M5. Notifikasi Email Selalu Gagal (Email Empty) — `app/api/pencapaian/berikan/route.ts:111`

Email dikirim dengan string kosong karena query hanya ambil `nama`, bukan `email`.

### M6. Notifikasi Award Juga Gagal — `app/api/pencapaian/award/route.ts:137,179-184`

Sama, `email: null` selalu dipass sehingga notifikasi awards tidak pernah terkirim.

### M7. Komentar Bahwa `'DITERIMA'` Tidak Ada di Schema — `app/api/wawancara/override/route.ts:35`

`existing.hasil === 'DITERIMA'` — tidak akan pernah terpenuhi karena enum hanya punya `LOLOS`, `TIDAK_LOLOS`, `PENDING`.

### M8. Absensi Mode Riwayat Mengabaikan `activeOrgId` — `app/api/organisas/absensi/route.ts` (path ambigu)

Jika `filterOrgId` undefined, data dari **semua** organisasi akan dikembalikan.

### M9. In-Memory Cache Wawancara Tidak Pernah Di-clear oleh Aksi Eksternal — `app/api/wawancara/route.ts:14`

Cache hanya di-clear di PUT/POST di file yang sama. Update dari Flutter API tidak meng-clear cache.

### M10. Date Timezone Bug di Dashboard — `app/api/dashboard/route.ts:79`

`new Date('2026-07-11')` menghasilkan midnight UTC, sementara record di database bisa dalam timezone berbeda. Hitungan absensi hari ini bisa off ±1 hari.

### M11. Koneksi Rate Limiter In-Memory — `lib/rate-limit.ts`

Rate limiting per-instance. Di serverless (Vercel) atau multi-instance, attacker bisa bypass rate limit dengan membanjiri instance yang berbeda.

### M12. Race Condition di Rate Limiter — `lib/rate-limit.ts:31-36`

`entry.count++` adalah read-modify-write tanpa lock. Dua request concurren bisa exceed limit.

### M13. Log Aktivitas Bisa Dihapus Semua Tanpa Scope — `app/api/log/route.ts:55`

`prisma.logAktivitas.deleteMany()` tanpa `where` menghancurkan seluruh audit trail.

### M14. Form Registrasi Tidak Cek Email — `app/registration/form/page.tsx:69-96`

Berbeda dengan form eskul dan osis-mpk, form registrasi umum tidak memiliki pengecekan email duplicate via `GET /api/registration/check-email`.

### M15. Kebocoran Data di Flutter Organizations Endpoint — `app/api/flutter/organizations/route.ts:48-67`

Mengembalikan semua organisasi tanpa filter berdasarkan JWT user's accessible orgs.

### M16. Flutter Login Tanpa Rate Limiting — `app/api/flutter/auth/login/route.ts`

Tidak ada brute-force protection. Attacker bisa melakukan unlimited login attempts.

---

## 🟢 LOW

### L1. `(prisma as any)` Dipakai di Banyak Tempat

| File | Baris |
|------|-------|
| `app/api/pengeluaran/route.ts` | 34, 40-42, 85, 132, 143 |
| `app/api/materi/route.ts` | Multiple |
| `app/api/kegiatan/route.ts` | Multiple |
| `app/api/pencapaian/route.ts` | Multiple |

Menghilangkan semua type safety. Jika model tidak ada di Prisma, error baru kelihatan di runtime.

### L2. `recordId: '0'` Hardcoded di Beberapa Log

`app/api/email/send/route.ts:122`, `app/api/export/route.ts:90`, `app/api/import/route.ts:100`

Tidak bisa melacak log ke record spesifik.

### L3. `getSession()` Pakai `cookies()` — Tidak Kompatibel di Semua Konteks

**File:** `lib/auth.ts:87-92` — `cookies()` dari `next/headers` hanya untuk Server Components, bukan API Routes.

### L4. JWT Verifikasi Ganda di `getSessionFromRequest`

**File:** `lib/auth.ts:98,104` — Token diverifikasi dua kali (sekali di `verifyToken`, sekali lagi untuk cek expired). Beban CPU tidak perlu.

### L5. `updateIpInfo` Punya Parameter `sesiId` Tidak Terpakai

**File:** `app/api/wawancara/antrian/route.ts:11` — Parameter `sesiId` tidak pernah digunakan di body function.

### L6. Array Index Out of Bounds jika Level Invalid

**File:** `lib/exp.ts:33` — `LEVEL_THRESHOLDS[level - 1]` jika `level` = 0 akan jadi `LEVEL_THRESHOLDS[-1]` = `undefined`.

### L7. CSS `border-opacity-70` Deprecated

**File:** `components/ui/LevelBadge.tsx:59` — Di Tailwind v3, ganti dengan `border-white/70`.

---

## 📊 Rangkuman per Fitur

| Fitur | Critical | High | Medium | Low | Total |
|-------|----------|------|--------|-----|-------|
| Authentication & Authorization | 4 | 2 | 2 | 2 | 10 |
| Member Management | 1 | 2 | 1 | 0 | 4 |
| Attendance (Absensi) | 1 | 1 | 1 | 0 | 3 |
| Cash/Finance | 1 | 1 | 0 | 0 | 2 |
| Pengeluaran | 1 | 0 | 0 | 1 | 2 |
| Organization | 3 | 1 | 0 | 0 | 4 |
| Wawancara | 0 | 1 | 4 | 2 | 7 |
| Registration | 1 | 0 | 1 | 0 | 2 |
| Gamification/EXP/Awards | 0 | 1 | 2 | 1 | 4 |
| School Year Progression | 0 | 0 | 0 | 0 | 3 (broken total) |
| Email System | 0 | 1 | 2 | 1 | 4 |
| Documentation | 0 | 0 | 0 | 1 | 1 |
| Dashboard | 0 | 0 | 1 | 0 | 1 |
| Log System | 0 | 1 | 1 | 1 | 3 |
| Flutter API | 2 | 1 | 2 | 0 | 5 |
| Admin Tools | 2 | 2 | 0 | 0 | 4 |
| **TOTAL** | **8** | **10** | **16** | **7** | **41** |

> **Catatan:** Angka school year progression tidak dimasukkan ke hitungan karena memang seluruh fiturnya broken total (3 file).

---

## ⚡ Prioritas Perbaikan

1. **Segera (Critical):** Auth bypass di 4 file (header-based auth) — C1
2. **Segera:** Tambah session check di 3 endpoint publik tanpa auth — C2
3. **Segera:** Hapus fallback secret JWT Flutter — C3
4. **Segera:** Fix backup endpoint yang selalu error — C4
5. **Segera:** Fix school year progression yang pakai model legacy — C5
6. **Segera:** Fix duplikasi transaksi kas di attendance upsert — C6
7. **Segera:** Hapus atau amankan public registration Flutter — C7
8. **Tinggi:** Fix filter backup clear database — C8
9. **Tinggi:** Konsistenkan role naming — H1, H9
10. **Tinggi:** Fix `canAccessMpk` — H2
