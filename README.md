# Artemis Series — Sistem Ekstrakurikuler & Organisasi

**Versi:** 2.0.0  
**Sekolah:** SMK Airlangga Balikpapan (Yayasan Airlangga Balikpapan)  
**Deploy:** [artemis.smkairlangga.sch.id](https://artemis.smkairlangga.sch.id)

Sistem informasi manajemen ekstrakurikuler dan organisasi siswa yang bersifat **multi-organisasi dinamis**. Administrator dapat membuat ekstrakurikuler atau organisasi baru kapan saja. Saat ini mencakup **Programming**, **English Club**, **OSIS**, dan **MPK**, dan dapat terus ditambahkan.

---

## Tech Stack

| Lapisan | Teknologi |
|---------|-----------|
| Framework | Next.js 14.2.5 (App Router, standalone) |
| Bahasa | TypeScript strict |
| Styling | Tailwind CSS 3, shadcn/ui |
| Database | PostgreSQL (Supabase / Neon) via Prisma 5 |
| Auth | JWT (jose) — httpOnly cookies |
| Realtime | Pusher |
| File/Image | Cloudinary |
| Email | Nodemailer + Google APIs (Gmail SMTP) |
| Chart | Recharts |
| PDF | jsPDF + jspdf-autotable |
| Excel | SheetJS (xlsx) |
| Validasi | Zod |
| State | TanStack React Query |
| Animasi | Framer Motion, GSAP |
| Container | Docker (Node 20 Alpine, multi-stage) |

---

## Struktur Direktori

```
app/                    # Halaman Next.js App Router
  absensi/              # Absensi harian
  admin/                # Panel admin (user, email, XP, organisasi)
  ambil-siswa/          # Ambil data siswa
  api/                  # ~31 grup route API
  dashboard/            # Dashboard utama dengan statistik & chart
  dokumentasi/          # Dokumentasi foto kegiatan
  export/               # Export data ke Excel
  hapus-peserta/        # Hapus peserta wawancara
  import/               # Import massal dari Excel/CSV
  jadwal/               # Jadwal kegiatan
  kas/                  # Buku kas (pemasukan)
  laporan/              # Laporan & statistik
  leaderboard/          # Papan peringkat gamifikasi
  log/                  # Log aktivitas
  login/                # Halaman login
  materi/               # Materi harian / notulen
  organisasi/           # Manajemen organisasi (buat/edit/hapus ekskul & organisasi)
  pencapaian/           # Pencapaian (achievements)
  pengeluaran/          # Pengeluaran kas
  qr-code/              # Generate QR code
  registration/         # Pendaftaran ekskul & OSIS/MPK
  rekap-absensi/        # Rekap absensi per siswa
  siswa/                # CRUD anggota
  update-sistem/        # Pengumuman update sistem
  wawancara/            # Sistem antrian wawancara OSIS & MPK

components/             # Komponen reusable
  admin/                # Komponen admin
  charts/               # Komponen chart
  documentation/        # Komponen tampilan dokumentasi
  layout/               # Sidebar, Topbar, DashboardLayout
  providers/            # QueryProvider (React Query)
  ui/                   # Badge, Modal, Table, ConfirmDialog, dll

lib/                    # Utilitas & service shared
  services/             # email-template, excel, gmail, organization
  auth.ts               # JWT sign/verify/refresh
  auth-shared.ts        # Role definitions & permission helpers
  prisma.ts             # Prisma singleton
  cloudinary.ts         # Upload ke Cloudinary
  email.ts              # Kirim email
  exp.ts                # Logika XP & level
  gamification.ts       # Utilitas gamifikasi
  hooks.ts              # Custom hooks
  log.ts                # Activity logging
  org-context.ts        # Isolasi data per organisasi
  pusher-client.ts      # Realtime client Pusher
  pusher-server.ts      # Realtime server Pusher
  rbac-middleware.ts     # RBAC untuk route API
  utils.ts              # formatCurrency, formatDate, dll

prisma/
  schema.prisma         # ~29 model database
  migrations/           # File migrasi Prisma

scripts/                # Script utilitas (seed, sync, dll)
docker/                 # Dockerfile, docker-compose, entrypoint
```

---

## Fitur Utama

### 1. Autentikasi & RBAC
- JWT httpOnly cookie (`ekskul_session`) dengan auto-refresh
- Role hierarkis: **SUPER_ADMIN** (full akses) → **administrator** → **organization_admin** (per organisasi)
- Admin dapat ditambahkan sebagai pengelola organisasi tertentu — sistem tidak terbatas pada role tetap
- Middleware otomatis untuk proteksi route & inject konteks user

### 2. Multi-Organisasi Dinamis (`/organisasi`, `/admin`)
- **Tidak terbatas pada jumlah tertentu** — Administrator (SUPER_ADMIN) dapat membuat, mengedit, dan menghapus ekstrakurikuler atau organisasi baru kapan saja
- Setiap organisasi memiliki data sendiri: anggota, absensi, kas, jadwal, materi, dokumentasi
- Admin per organisasi hanya bisa mengelola organisasi yang ditugaskan padanya — data terisolasi penuh
- Sistem siap menampung puluhan organisasi tanpa perubahan kode

### 3. Dashboard & Analytics
- Statistik anggota per organisasi, absensi hari ini, saldo kas
- Chart mingguan absensi, tren kas 6 bulan, statistik API 30 hari
- Papan peringkat dengan podium (gold/silver/bronze)
- Mode presentasi untuk tampilan layar penuh
- Form tambah anggota cepat

### 4. Manajemen Anggota (`/siswa`)
- CRUD lengkap per organisasi
- Search, pagination, filter kelas/kejuruan
- Pemberian XP
- Import massal dari Excel/CSV

### 5. Absensi (`/absensi`, `/rekap-absensi`)
- Absensi harian (Hadir/Izin/Sakit/Tidak Hadir)
- Dukungan QR code
- Rekap per siswa: jumlah bulanan, persentase, streak, chart 6 bulan

### 6. Keuangan (`/kas`, `/pengeluaran`)
- Pemasukan kas per anggota
- Pencatatan pengeluaran
- Saldo berjalan
- Riwayat transaksi dengan filter organisasi

### 7. Sistem Wawancara (`/wawancara`)
- Kelola sesi wawancara (SCHEDULED → ACTIVE → SELESAI)
- Generate QR token untuk validasi peserta
- Antrian dengan nomor, validasi IP/GPS, jarak dari venue
- Penilaian hasil wawancara dengan override admin
- Chat real-time dalam sesi wawancara
- Export ke Excel

### 8. Pendaftaran (`/registration`)
- Form pendaftaran publik untuk setiap ekstrakurikuler & organisasi yang tersedia
- Admin dapat mengaktifkan/menonaktifkan pendaftaran per organisasi
- Generate token QR untuk verifikasi pendaftaran
- Status: MENUNGGU → DITERIMA/DITOLAK/CALON

### 9. Gamifikasi: XP & Level
- Level 1–5: Beginner (0), Intermediate (150), Advanced (350), Expert (600), Master (900+)
- Sumber XP: absensi (+10), tugas (+20), partisipasi (+5), pencapaian (+30), pelanggaran (-10)
- Log perubahan XP lengkap
- Achievement system dengan ikon & deskripsi

### 10. Email & Pengumuman
- Kirim email/announcement ke anggota organisasi
- Template email per organisasi
- Import penerima dari Excel
- Integrasi Gmail SMTP

### 11. Import / Export
- Import anggota dari Excel/CSV dengan mapping kolom
- Export data ke Excel (.xlsx) dan PDF

### 12. Log Aktivitas
- Catat semua aktivitas admin (siapa, apa, kapan)
- Filter berdasarkan aksi, admin, organisasi, tanggal

### 13. Keamanan & Isolasi Data
- Isolasi data ketat antar organisasi (`org-context.ts`)
- RBAC pada setiap endpoint kritis
- Rate limiting API
- Security headers: HSTS, X-Frame-Options, X-Content-Type-Options, dll

---

## Model Database Utama (Prisma — ~29 model)

| Model | Fungsi |
|-------|--------|
| User | Pengguna sistem (admin) dengan role |
| Organization | Organisasi dinamis — bisa dibuat kapan saja oleh admin |
| OrganizationAdmin | Relasi many-to-many user ↔ org |
| Member | Anggota dengan XP, level, jabatan |
| Attendance | Rekam absensi harian |
| CashTransaction | Pemasukan kas |
| CashExpense | Pengeluaran kas |
| Registration / RegistrationEskul / RegistrationOsisMpk | Pendaftaran |
| SesiWawancara / AntrianWawancara / HasilWawancara | Wawancara |
| LogAktivitas | Log aktivitas |
| Achievement / MemberAchievement / Pencapaian | Gamifikasi |
| Material / Schedule / Documentation | Materi, jadwal, dokumentasi |
| EmailTemplate / EmailLog / EmailImportLog / EmailSetting | Email |
| SchoolYearProgression / ClassProgressionLog | Kenaikan kelas |

---

## Scripts Penting

```bash
npm run dev          # Development server
npm run build        # Build untuk production
npm start            # Start production
npx prisma migrate   # Migrasi database
npx prisma studio    # Prisma Studio (GUI database)
```

---

## Deployment

- **Output:** Next.js standalone
- **Docker:** Multi-stage build (Node 20 Alpine) dengan healthcheck
- **Environment:** Supabase + Neon (PostgreSQL), JWT, Cloudinary, Pusher
- **Platform:** Vercel / Railway / VPS (Docker)

---

## Catatan Perbaikan (Juni 2026)

Lima isu kritis telah diperbaiki:
1. **Session Drop** — Auto-refresh token via middleware
2. **State Leak Antar Organisasi** — Isolasi dengan `org-context.ts`
3. **Database Clear Mismatch** — Backup otomatis + konfirmasi konsisten
4. **Persistence Absensi & Kas** — Verifikasi data setelah simpan
5. **Missing RBAC** — Middleware RBAC ketat untuk endpoint XP & admin

---

Dikembangkan untuk **SMK Airlangga Balikpapan** — Artemis Series — SKARLAKES Ecosystem.
