# SISKO v2 - Dynamic Organization & Extracurricular Management System

## Deskripsi

SISKO (Sistem Informasi Sekolah & Organisasi) adalah platform manajemen organisasi dan ekstrakurikuler sekolah yang mendukung:

- Manajemen Anggota
- Absensi Realtime
- Kas Organisasi
- Level & Progress
- Hak Akses Administrator
- Multi Organisasi
- Multi Sekolah
- Dashboard Dinamis

Sistem dirancang agar Administrator dapat membuat Organisasi atau Ekstrakurikuler baru tanpa perlu membuat tabel atau halaman secara manual.

---

## Tujuan Fitur

Saat Administrator membuat Organisasi atau Ekstrakurikuler baru, sistem otomatis menyediakan:

- Dashboard Organisasi
- Data Anggota
- Data Absensi
- Data Kas
- Data Progress
- Administrator Organisasi
- Role & Permission
- CardNav Dashboard

---

## Dashboard Administrator

### CardNav Baru

Tambahkan CardNav baru pada Dashboard Administrator.

```
┌─────────────────────────────┐
│ Organisasi & Ekstrakurikuler│
│ Kelola seluruh unit sekolah │
│ Total : 12 Unit             │
└─────────────────────────────┘
```

**Route:** `/admin/organizations`

---

## Halaman Organisasi & Ekstrakurikuler

Menampilkan seluruh organisasi dan eskul yang aktif.

### Tombol
- `+ Tambah Organisasi / Eskul`

### Contoh Card

```
┌────────────────────┐
│ Programming        │
│ Ekstrakurikuler    │
│ 30 Anggota         │
└────────────────────┘

┌────────────────────┐
│ English Club       │
│ Ekstrakurikuler    │
│ 25 Anggota         │
└────────────────────┘

┌────────────────────┐
│ OSIS               │
│ Organisasi         │
│ 60 Anggota         │
└────────────────────┘

┌────────────────────┐
│ MPK                │
│ Organisasi         │
│ 35 Anggota         │
└────────────────────┘
```

---

## Form Tambah Organisasi / Eskul

### Kategori
**Dropdown**
- Organisasi
- Ekstrakurikuler

### Nama Organisasi / Eskul
**Input Text**

Contoh:
- Programming
- English Club
- OSIS
- MPK
- PMR
- Pramuka

### Asal Sekolah
**Dropdown**
- SMK Airlangga
- SMK Kesehatan Airlangga
- Gabungan Dua Sekolah

### Status
**Dropdown**
- Aktif
- Tidak Aktif

### Tombol
- `[ Simpan ]`
- `[ Batal ]`

---

## Proses Otomatis Setelah Dibuat

Ketika Administrator menekan tombol **Simpan**, sistem otomatis:

1. Membuat Data Organisasi
2. Membuat Dashboard Organisasi
3. Membuat Modul Data Anggota
4. Membuat Modul Absensi
5. Membuat Modul Kas
6. Membuat Modul Progress
7. Membuat Pengaturan Organisasi
8. Membuat Role Organisasi
9. Menampilkan Card Organisasi

---

## Struktur Workspace Organisasi

**Contoh:** Programming

Sistem membuat workspace:

```
Programming
├── Dashboard
├── Data Anggota
├── Absensi
├── Kas
├── Progress
├── Administrator
└── Pengaturan
```

---

## Data Anggota

### Menu
Data Anggota

### Struktur Tabel

| No | NIS | Nama Siswa | Kelas | Eskul | Level & Progress | Terdaftar |
|---|---|---|---|---|---|---|

### Tampilan Nama Siswa

Gmail ditampilkan di bawah nama siswa.

**Contoh:**
```
Abhinawa Pradya Gurtino
abhinawa@gmail.com

atau

Fahry Aditya Setiawan
fahry@gmail.com
```

### Tampilan Tabel Lengkap

| No | NIS | Nama Siswa | Kelas | Eskul |
|---|---|---|---|---|
| 1 | 12345 | Fahry Aditya Setiawan<br>fahry@gmail.com | X AKL | Programming |

### Fitur

- Tambah Anggota
- Edit Anggota
- Hapus Anggota
- Search
- Filter Kelas
- Filter Level
- Import Excel
- Export Excel

---

## Sistem Level & Progress

Setiap organisasi memiliki sistem level sendiri.

### Kolom: Level & Progress

**Contoh:**
```
Lvl 1
0 EXP
```
(dengan progress bar)

### Contoh Level Organisasi

#### Programming
- Level 1 = HTML
- Level 2 = CSS
- Level 3 = JavaScript
- Level 4 = React
- Level 5 = Next.js

#### English Club
- Level 1 = Vocabulary
- Level 2 = Grammar
- Level 3 = Conversation
- Level 4 = Public Speaking
- Level 5 = Debate

---

## Modul Absensi

### Menu
Absensi

### Struktur Tabel

| Nama Siswa | Status Kehadiran | Uang Kas | Keterangan |
|---|---|---|---|

### Status Kehadiran

- Hadir
- Tidak Hadir
- Izin
- Sakit

### Uang Kas

Input langsung saat absensi.

**Contoh:**
- Rp 2.000
- Rp 5.000
- Rp 10.000

### Fitur

- Absensi Realtime
- Tandai Semua
- Rekap Bulanan
- Rekap Tahunan
- Riwayat Kehadiran
- Export Excel

---

## Modul Kas

### Menu
Kas

### Struktur Tabel

| Nama Siswa | Nominal | Tanggal | Keterangan |
|---|---|---|---|

### Fitur

- Input Kas
- Riwayat Kas
- Total Kas
- Export Excel
- Rekap Bulanan

---

## Administrator Organisasi

### Menu
Administrator

### Tujuan

Setiap organisasi wajib memiliki Administrator sendiri.

**Contoh:**
- Programming Admin
- English Club Admin

### Form Administrator

- Nama
- Email
- Username
- Password
- Role

### Role

Organization Admin

### Pilih Organisasi

**Dropdown:**
- Programming
- English Club
- OSIS
- MPK
- PMR
- Pramuka

---

## Sistem Hak Akses

### Super Administrator

Dapat:
- Melihat seluruh organisasi
- Membuat organisasi
- Menghapus organisasi
- Membuat administrator
- Mengelola seluruh sistem

### Organization Admin

Hanya dapat mengakses organisasi yang ditugaskan.

**Contoh:**
```json
{
  "role": "organization_admin",
  "organizationId": "programming"
}
```

#### Akses Diizinkan
- `/programming`

#### Akses Ditolak
- `/english-club`
- `/osis`
- `/mpk`

### Validasi Server

Setiap request wajib memeriksa:

```json
{
  "organizationId": "programming"
}
```

Jika tidak sesuai:

```json
{
  "success": false,
  "message": "Akses ditolak."
}
```

---

## Struktur Database

### organizations

| Kolom | Tipe |
|---|---|
| id | INT (Primary Key) |
| name | VARCHAR |
| slug | VARCHAR |
| category | VARCHAR (Organisasi/Ekstrakurikuler) |
| school_origin | VARCHAR |
| status | VARCHAR (Aktif/Tidak Aktif) |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

### organization_admins

| Kolom | Tipe |
|---|---|
| id | INT (Primary Key) |
| user_id | INT (Foreign Key) |
| organization_id | INT (Foreign Key) |
| created_at | TIMESTAMP |

### members

| Kolom | Tipe |
|---|---|
| id | INT (Primary Key) |
| organization_id | INT (Foreign Key) |
| nis | VARCHAR |
| name | VARCHAR |
| email | VARCHAR |
| class | VARCHAR |
| level | INT |
| exp | INT |
| progress | INT |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

### attendance

| Kolom | Tipe |
|---|---|
| id | INT (Primary Key) |
| organization_id | INT (Foreign Key) |
| member_id | INT (Foreign Key) |
| date | DATE |
| attendance_status | VARCHAR |
| cash_amount | DECIMAL |
| notes | TEXT |
| created_at | TIMESTAMP |

### cash_transactions

| Kolom | Tipe |
|---|---|
| id | INT (Primary Key) |
| organization_id | INT (Foreign Key) |
| member_id | INT (Foreign Key) |
| amount | DECIMAL |
| description | VARCHAR |
| created_at | TIMESTAMP |

---

## Keamanan Sistem

- Role Based Access Control (RBAC)
- Organization Isolation
- Server Side Validation
- Protected Route
- Session Validation
- Audit Log Administrator

---

## Keunggulan

- ✅ Multi Organisasi
- ✅ Multi Ekstrakurikuler
- ✅ Multi Sekolah
- ✅ Realtime Absensi
- ✅ Sistem Kas Terintegrasi
- ✅ Sistem Level & EXP
- ✅ Administrator Terpisah
- ✅ Aman Berdasarkan Role
- ✅ Hemat Resource Supabase
- ✅ Hemat Resource Neon
- ✅ Mobile Friendly
- ✅ Siap Integrasi Sertifikat
- ✅ Siap Integrasi Notifikasi Email
- ✅ Siap Integrasi Pendaftaran Online
- ✅ Siap Menjadi Sistem Manajemen Organisasi Sekolah Terpusat
