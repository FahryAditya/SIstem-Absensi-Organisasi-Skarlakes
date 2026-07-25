# Alur Program Wawancara (Lengkap)

## 1. Arsitektur
Next.js 14 (App Router), PostgreSQL + Prisma ORM, JWT auth, Tailwind CSS, Pusher (real-time).

## 2. Role-Based Access
| Role | Akses |
|------|-------|
| `SUPER_ADMIN` / `administrator` | Full: create/edit/delete sesi, override hasil, export, chat, hapus peserta |
| `admin_osis_mpk` / `ORG_ADMIN` | Input hasil, manage antrian, chat (tidak bisa create/activate/finalize/cancel sesi atau override) |
| Publik (unauthenticated) | Hanya halaman `/wawancara/scan` |

---

## 3. Alur Lengkap (12 Fase)

### Fase 1: Login & Navigasi
1. User login → JWT disimpan di cookie `ekskul_session` (8 jam)
2. Redirect ke `/dashboard`
3. Sidebar menampilkan link **"Wawancara OSIS & MPK"** untuk role yang berhak
4. Klik → navigasi ke `/wawancara`

### Fase 2: Manajemen Sesi (Admin Only)
**Status Lifecycle:**
```
INACTIVE --> SCHEDULED --> ACTIVE --> SELESAI (locked)
                                \-> DIBATALKAN (locked)
```
- **Buat sesi**: Pilih organisasi (OSIS/MPK), set jadwal_mulai & jadwal_selesai → POST `/api/wawancara`
- **Auto-scheduling**: Tombol "Jadwalkan" → auto-create sesi 08:00-15:00
- **Transisi status via PUT**: `activate`, `finish`, `cancel`
- **Auto-processing** (setiap 30 detik): SCHEDULED → ACTIVE jika waktu mulai tiba; ACTIVE → SELESAI jika lewat jadwal_selesai

### Fase 3: Generate QR Code (Admin)
1. Klik tombol "Generate QR" → POST `/api/wawancara/qr`
2. QR sebelumnya di-deactivate
3. Token 24-byte random hex, valid 3 hari
4. URL: `/wawancara/scan?token=<token>`
5. Dicetak/ditampilkan di venue

### Fase 4: Registrasi Peserta (Publik via Scan QR)
1. Calon scan QR atau buka `/wawancara/scan?token=<token>`
2. System validasi QR (aktif, tidak expired, ada sesi ACTIVE)
3. Calon isi form:
   - **Nama** (validasi ketat: no digits, no repeated chars)
   - **Kelas** (X/XI/XII) & Jurusan
   - **Organisasi** (OSIS/MPK toggle buttons)
4. Submit → POST `/api/wawancara/antrian`:
   - Validasi duplikat (nama+kelas sama hanya diizinkan jika sebelumnya DITOLAK_VPN)
   - Alokasi nomor_antrian increment (dengan retry untuk race condition)
   - Enrich IP (negara, ISP, VPN detection via ip-api.com)
   - Set `status_validasi`: SAH / SAH_DICURIGAI / DITOLAK_VPN / TIDAK_SAH
   - Trigger Pusher event `queue-updated`
5. Calon melihat:
   - Nomor antrian (contoh: OS12 atau MP08)
   - Layar tunggu real-time via Pusher
   - **Saat dipanggil**: animasi "NAMA ANDA SEDANG DIPANGGIL!"
   - **Saat selesai**: "WAWANCARA SELESAI!"

**Tambah Manual (Admin)**: Bypass QR, set `status_validasi='SAH'` dengan alasan "Ditambahkan Manual oleh Admin"

### Fase 5: Manajemen Antrian (Admin Interface)
**Status participant:**
```
MENUNGGU --> WAWANCARA --> SELESAI_WAWANCARA
```
- Real-time via Pusher (`wawancara-<sessionId>`), fallback polling 4 detik
- Klik "Wawancarai Peserta" → PATCH status ke `WAWANCARA`
- **Safeguard**: Jika interviewer tutup tab saat `WAWANCARA`, `sendBeacon` revert ke MENUNGGU
- Modal hasil terbuka otomatis

### Fase 6: Input Hasil Wawancara
Interviewer mengisi modal:
| Field | Opsi |
|-------|------|
| **Keterangan** | AKTIF / KURANG_AKTIF |
| **Hasil** | LOLOS / TIDAK_LOLOS / PENDING |
| **Persentase** | 1-100 |
| **Catatan** | Opsional, max 500 chars |

- POST `/api/wawancara/hasil` → Prisma `upsert` (create/update)
- Auto-update antrian ke `SELESAI_WAWANCARA`
- Jika sesi sudah SELESAI/DIBATALKAN, hasil terkunci permanen

### Fase 7: Override Hasil (Admin Only)
1. Untuk peserta dengan hasil `TIDAK_LOLOS` atau `PENDING`
2. **Hanya** `SUPER_ADMIN`/`administrator` yang bisa override
3. Wajib isi alasan → POST `/api/wawancara/override`
4. Hasil diubah ke `LOLOS`, tercatat `override_by`, `override_alasan`, `override_at`
5. Tampilkan note "Override: <reason>" di queue

### Fase 8: Finalisasi Sesi
1. Admin klik "Finalisasi" → konfirmasi "Setelah finalisasi, semua data akan terkunci permanen"
2. PUT `/api/wawancara` → `status='SELESAI'`, `finalized_at` & `locked_at` di-set
3. Setelah finalisasi:
   - Tidak bisa tambah peserta baru
   - Tidak bisa edit hasil
   - Tidak bisa ubah status
   - Sesi read-only

### Fase 9: Live Chat (Internal)
- Chanel: `chat-<sessionId>` via Pusher, fallback polling 4 detik
- Fitur: Optimistic UI, 250 char limit, unread count badge, auto-scroll
- Hanya aktif saat ada sesi ACTIVE

### Fase 10: Export Excel
- Modal 3 opsi: Semua OSIS, Semua MPK, atau Sesi Saat Ini
- GET `/api/wawancara/export?sesiId=X` atau `?org=osis|mpk`
- Kolom: No, Organisasi, No Antrian, Nama, Kelas, Keterangan, Hasil, Persentase, Catatan, Interviewer, Waktu Daftar, Status Validasi, Status IP, IP, Negara, GPS, Jarak, Token QR

### Fase 11: Hapus Peserta
- **Batch** (dari `/hapus-peserta`): DELETE `/api/wawancara/antrian?ids=1,2,3`
- **Single**: DELETE `/api/wawancara/antrian/[id]`
- Hanya administrator, cascade hapus hasil_wawancara
- Tidak bisa hapus jika status `WAWANCARA`

### Fase 12: Cleanup Data (Admin)
- POST `/api/admin/clear-wawancara` dengan konfirmasi "HAPUS PERMANEN"
- Mode: `sesi` (hapus semua data wawancara), `chat` (hapus chat saja)

---

## 4. Diagram Data Flow
```
[Peserta]                    [Admin/Interviewer]              [Super Admin]
    |                              |                              |
    v                              v                              v
/scan?token=X              /wawancara                    /api/admin/clear
    |                              |
    | POST /antrian                | POST/GET/PUT sesi
    v                              | POST hasil
[SesiWawancara]                    | POST override
    |                              | POST qr
    v                              | POST chat
[AntrianWawancara]                 | GET export
    |                              |
    v                              v
[HasilWawancara]             Pusher: wawancara-{sesiId}
                                    chat-{sesiId}
```

---

## 5. State Summary
| Entity | States | Pengubah |
|--------|--------|----------|
| **SesiWawancara.status** | INACTIVE → SCHEDULED → ACTIVE → SELESAI/DIBATALKAN | Admin (manual) / Auto (time-based) |
| **Antrian.status** | MENUNGGU → WAWANCARA → SELESAI_WAWANCARA | Admin PATCH / Auto saat hasil disimpan |
| **Antrian.status_validasi** | SAH / SAH_DICURIGAI / DITOLAK_VPN / TIDAK_SAH | Set saat registrasi |
| **Hasil.hasil** | null → LOLOS/TIDAK_LOLOS/PENDING → LOLOS (override) | Interviewer / Admin (override) |
| **QrWawancara.aktif** | true → false | Admin (saat generate QR baru) |

---

## 6. Struktur File (Wawancara-related)
| File | Tujuan |
|------|--------|
| `app/wawancara/page.tsx` | Server component - auth gate + render client |
| `app/wawancara/WawancaraClient.tsx` | Main interview management UI (1144 baris) |
| `app/wawancara/scan/page.tsx` | Public scan page |
| `app/wawancara/scan/ScanWawancaraClient.tsx` | Public scan/queue registration UI (309 baris) |
| `app/api/wawancara/route.ts` | Session CRUD + auto-activation (244 baris) |
| `app/api/wawancara/antrian/route.ts` | Queue enqueue, status PATCH, batch DELETE (302 baris) |
| `app/api/wawancara/antrian/[id]/route.ts` | Single participant DELETE (86 baris) |
| `app/api/wawancara/hasil/route.ts` | Result upsert (85 baris) |
| `app/api/wawancara/override/route.ts` | Admin override to LOLOS (64 baris) |
| `app/api/wawancara/public/route.ts` | Public session lookup (64 baris) |
| `app/api/wawancara/qr/route.ts` | QR token CRUD (122 baris) |
| `app/api/wawancara/chat/route.ts` | Real-time chat (96 baris) |
| `app/api/wawancara/export/route.ts` | Excel export (118 baris) |
| `app/api/admin/clear-wawancara/route.ts` | Admin data cleanup (65 baris) |
| `prisma/schema.prisma` | All database models (790 baris) |
| `lib/auth.ts` | JWT + session utilities |
| `lib/auth-shared.ts` | Role-checking helpers |
| `middleware.ts` | Auth middleware |