# Administrator & Admin Pages Checklist

File ini digunakan sebagai panduan untuk AI memeriksa semua halaman Administrator dan Admin lainnya.

## Daftar Role & Hak Akses

| Role | Label | Akses |
|------|-------|-------|
| `SUPER_ADMIN` | Super Administrator | Semua halaman + Log + System Update |
| `administrator` | Administrator | Semua halaman + Log + System Update |
| `admin_programming` | Admin Programming | Hanya data Programming |
| `admin_english` | Admin English Club | Hanya data English Club |
| `admin_osis_mpk` | Admin OSIS & MPK | Hanya data OSIS & MPK |
| `organization_admin` | Organization Admin | Hanya org tertentu |

---

## Halaman yang Harus Diperiksa

### 1. Dashboard (`/dashboard`)
- [ ] Halaman load tanpa error
- [ ] Stat cards muncul (Total Anggota, Hadir Hari Ini, Sisa Saldo Kas, dll)
- [ ] Chart rendering dengan benar
- [ ] Leaderboard muncul
- [ ] Recent activity log muncul
- [ ] Notifikasi update sistem muncul (jika ada)

**Expected:** Semua role bisa akses, data sesuai role

---

### 2. Data Anggota (`/siswa`)
- [ ] Halaman load tanpa error
- [ ] Tabel anggota muncul
- [ ] Search berfungsi
- [ ] Pagination berfungsi
- [ ] Tombol "Tambah Anggota" berfungsi
- [ ] Modal tambah/edit muncul
- [ ] Form validation bekerja
- [ ] Hapus anggota dengan konfirmasi detail
- [ ] XP awarding berfungsi

**Expected:** Semua admin bisa akses, data sesuai ekskul mereka

---

### 3. Absensi (`/absensi`)
- [ ] Halaman load tanpa error
- [ ] Pilih tanggal berfungsi
- [ ] QR code scanning berfungsi
- [ ] Manual absensi berfungsi
- [ ] Status kehadiran (Hadir/Izin/Sakit) bisa dipilih
- [ ] Bulk absensi berfungsi
- [ ] Data tersimpan dengan benar

**Expected:** Admin sesuai ekskul bisa akses

---

### 4. Rekap Absensi (`/rekap-absensi`)
- [ ] Halaman load tanpa error
- [ ] Tab eskul muncul sesuai role
- [ ] **Eskul baru otomatis muncul** (jika ada eskul baru di database)
- [ ] List anggota per eskul muncul
- [ ] Detail rekap per anggota muncul
- [ ] Grafik kehadiran 6 bulan terakhir
- [ ] Riwayat absensi muncul
- [ ] Streak calculation benar

**Expected:** Tab dinamis, Total Siswa = jumlah semua siswa eskul (bukan hanya yang absen)

---

### 5. Buku Kas (`/kas`)
- [ ] Halaman load tanpa error
- [ ] Saldo kas muncul
- [ ] Tabel pembayaran anggota muncul
- [ ] Search berfungsi
- [ ] Filter organisasi berfungsi (jika multi-org)
- [ ] Modal setor kas muncul
- [ ] Dropdown pilih anggota berfungsi
- [ ] Search anggota di modal berfungsi
- [ ] Transaksi tersimpan dengan benar
- [ ] Link "Tarik Kas" ke `/pengeluaran` berfungsi

**Expected:** API accept `org` slug parameter, response include `orgs` array

---

### 6. Pengeluaran (`/pengeluaran`)
- [ ] Halaman load tanpa error
- [ ] Tabel pengeluaran muncul
- [ ] Form tambah pengeluaran berfungsi
- [ ] Total pengeluaran dihitung dengan benar

**Expected:** Admin bisa akses

---

### 7. Organisasi (`/organisasi`)
- [ ] Halaman load tanpa error
- [ ] List organisasi/ekskul muncul
- [ ] Detail per organisasi muncul
- [ ] Anggota per organisasi muncul

**Expected:** Admin bisa lihat organisasi mereka

---

### 8. Wawancara (`/wawancara`)
- [ ] Halaman load tanpa error
- [ ] Session management berfungsi
- [ ] Antrian peserta muncul
- [ ] Status sesi (SCHEDULED/ACTIVE/SELESAI) benar
- [ ] Form penilaian berfungsi
- [ ] Export ke Excel berfungsi
- [ ] Tombol "Hapus Peserta" ke `/hapus-peserta` berfungsi

**Expected:** admin_osis_mpk dan administrator bisa akses

---

### 9. Hapus Peserta (`/hapus-peserta`)
- [ ] Halaman load tanpa error
- [ ] Tabel peserta wawancara muncul
- [ ] Filter berfungsi
- [ ] Search berfungsi
- [ ] Hapus single peserta dengan **detail data card**
- [ ] Hapus bulk dengan **confirmation input** (ketik "HAPUS")
- [ ] Peserta yang sedang diwawancarai tidak bisa dihapus

**Expected:** ConfirmDialog enhanced dengan detail & confirmation input

---

### 10. Pencapaian (`/pencapaian`)
- [ ] Halaman load tanpa error
- [ ] List pencapaian anggota muncul
- [ ] Filter berfungsi
- [ ] Detail pencapaian muncul

**Expected:** Admin bisa akses

---

### 11. QR Code (`/qr-code`)
- [ ] Halaman load tanpa error
- [ ] QR code generate berfungsi
- [ ] Validasi otomatis berfungsi
- [ ] Delete mode berfungsi

**Expected:** Admin bisa akses

---

### 12. Import (`/import`)
- [ ] Halaman load tanpa error
- [ ] Upload Excel berfungsi
- [ ] Preview data muncul
- [ ] Import berhasil

**Expected:** Admin bisa akses

---

### 13. Export (`/export`)
- [ ] Halaman load tanpa error
- [ ] Export ke Excel berfungsi
- [ ] Filter export berfungsi

**Expected:** Admin bisa akses

---

### 14. Laporan (`/laporan`)
- [ ] Halaman load tanpa error
- [ ] Statistik sistem muncul
- [ ] Chart rendering benar

**Expected:** Admin bisa akses

---

### 15. Log Aktivitas (`/log`) - SUPER_ADMIN & administrator only
- [ ] Halaman load tanpa error
- [ ] List log aktivitas muncul
- [ ] Filter berfungsi
- [ ] Clear log dengan konfirmasi
- [ ] Role lain redirect ke dashboard

**Expected:** Hanya SUPER_ADMIN dan administrator

---

### 16. Kelola User & Admin (`/admin`)
- [ ] Halaman load tanpa error
- [ ] List user muncul
- [ ] Role stats cards muncul
- [ ] Tombol "Menu Pengelola" berfungsi
- [ ] Dropdown menu muncul dengan animasi
- [ ] **Link "Manajemen Anggota" ke `/siswa`** (bukan `/admin/members`)
- [ ] Tambah user berfungsi
- [ ] Edit user berfungsi
- [ ] Hapus user dengan konfirmasi
- [ ] Beri penghargaan berfungsi
- [ ] Optimasi DB berfungsi
- [ ] Backup SQL berfungsi
- [ ] Bersihkan Wawancara berfungsi
- [ ] Pengaturan Email berfungsi

**Expected:** Administrator dan SUPER_ADMIN

---

### 17. Kelola EXP (`/admin/exp`)
- [ ] Halaman load tanpa error
- [ ] Tab organisasi muncul
- [ ] Form pemberikan EXP berfungsi
- [ ] Dropdown anggota dengan search berfungsi
- [ ] Riwayat EXP muncul
- [ ] Level calculation benar

**Expected:** API accept `organisasi` slug parameter

---

### 18. Kirim Email/Pengumuman (`/admin/email`)
- [ ] Halaman load tanpa error
- [ ] Tab organisasi muncul
- [ ] Form email berfungsi
- [ ] Pilih penerima berfungsi
- [ ] Search penerima berfungsi
- [ ] Email terkirim dengan benar

**Expected:** Admin bisa akses

---

### 19. Riwayat Email (`/admin/email/history`)
- [ ] Halaman load tanpa error
- [ ] List email terkirim muncul
- [ ] Detail email muncul

**Expected:** Admin bisa akses

---

### 20. Update Sistem (`/update-sistem`) - SUPER_ADMIN & administrator only
- [ ] Halaman load tanpa error (bukan redirect ke dashboard)
- [ ] Form update berfungsi
- [ ] Tipe notifikasi (Update/Pengumuman/Perbaikan) bisa dipilih
- [ ] Riwayat update muncul
- [ ] Clear history berfungsi
- [ ] Role lain redirect ke dashboard

**Expected:** Role check menggunakan `administrator` (bukan `ORG_ADMIN`)

---

### 21. Organisasi Management (`/admin/organizations`)
- [ ] Halaman load tanpa error
- [ ] List organisasi muncul
- [ ] CRUD organisasi berfungsi
- [ ] Settings per organisasi berfungsi

**Expected:** Administrator dan SUPER_ADMIN

---

### 22. Penerimaan Pendaftaran (`/admin/registration/acceptance`)
- [ ] Halaman load tanpa error
- [ ] List pendaftar muncul
- [ ] Accept/reject berfungsi
- [ ] Link pendaftaran berfungsi

**Expected:** Administrator dan SUPER_ADMIN

---

## Checklist Teknis

### API Parameter Contracts
- [ ] `/api/kas` accept `org` (slug) parameter
- [ ] `/api/kas` response include `orgs` array
- [ ] `/api/exp` accept `organisasi` (slug) parameter
- [ ] Semua API resolve slug ke org ID dengan benar

### SessionUser Type
- [ ] `SessionUser.role` type adalah `string` (bukan union type sempit)
- [ ] `ROLE_LABELS` include semua role:
  - `SUPER_ADMIN`
  - `administrator`
  - `admin_programming`
  - `admin_english`
  - `admin_osis_mpk`
  - `organization_admin`

### ConfirmDialog Component
- [ ] Support `details` prop untuk menampilkan data detail
- [ ] Support `confirmInput` prop untuk konfirmasi bulk delete
- [ ] Visual hierarchy jelas (icon, title, message, details, input, actions)

### Navigation Links
- [ ] AdminDropdownMenu "Manajemen Anggota" → `/siswa` (bukan `/admin/members`)
- [ ] Sidebar "Daftar Anggota" → `/siswa`
- [ ] Semua link tidak ada yang 404

---

## Cara Menggunakan Checklist Ini

1. **Login sebagai setiap role** dan periksa halaman yang bisa diakses
2. **Verifikasi setiap item** di checklist
3. **Laporkan issue** jika ada item yang tidak sesuai
4. **Update checklist** jika ada fitur baru atau perubahan

---

## Catatan Penting

- **Rekap Absensi:** Tab eskul harus dinamis dari database, bukan hardcoded
- **Buku Kas & EXP:** API harus accept slug parameter, bukan hanya orgId
- **Update Sistem:** Role check harus `administrator`, bukan `ORG_ADMIN`
- **ConfirmDialog:** Harus support detail data dan confirmation input
- **Navigation:** Semua link harus benar, tidak ada yang 404

---

*Checklist ini dibuat untuk memastikan semua halaman Administrator dan Admin berfungsi dengan baik setelah perbaikan Sprint 1 dan bug fixes.*

*Dibuat: 19 Juni 2026*
