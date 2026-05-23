# ARTEMIS OS — AI Prompt Penambahan Fitur
> Sistem Manajemen Ekstrakurikuler SKARLAKE v18.5.0

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 15 + TypeScript (TSX) |
| Styling | Tailwind CSS |
| ORM | Prisma |
| Database | PostgreSQL (Neon) |
| Auth + Realtime | Supabase |
| Media | Cloudinary |
| Email | Resend |
| Rate Limit | Upstash |
| Hosting | Vercel |

---

## Konteks Sistem

Sistem ini mengelola **4 organisasi sekolah**:

| # | Nama | Tipe |
|---|------|------|
| 1 | Programming | Ekstrakurikuler |
| 2 | English Club | Ekstrakurikuler |
| 3 | OSIS | Organisasi |
| 4 | MPK | Organisasi |

Setiap organisasi punya anggota siswa dengan data:
`nama` `kelas` `jurusan` `email` `foto_url` `jabatan` `exp` `level`

---

## Fitur yang Sudah Ada

- Dashboard dengan stat cards
- CRUD Siswa per organisasi
- Input & rekap absensi
- Buku kas & pengeluaran
- QR Code wawancara OSIS & MPK
- Leaderboard dasar (nama + XP)
- Export Excel
- Import CSV massal
- Log aktivitas
- Backup SQL
- Email notifikasi via Resend
- Role: Administrator, Pengajar, Siswa

---

## Fitur yang Akan Ditambah

### 1. Level System

Siswa punya level 1–5, naik berdasarkan total EXP.

| Level | Nama | EXP Range |
|-------|------|-----------|
| Lv 1 | Beginner | 0 – 150 |
| Lv 2 | Intermediate | 150 – 350 |
| Lv 3 | Advanced | 350 – 600 |
| Lv 4 | Expert | 600 – 900 |
| Lv 5 | Master | 900+ |

- Level naik **otomatis** saat EXP mencapai threshold
- Trigger **email notifikasi** saat naik level

---

### 2. EXP System

**Programming & English Club:**

| Aksi | EXP |
|------|-----|
| Hadir ekskul | +10 |
| Kumpul tugas tepat waktu | +20 |
| Aktif di pertemuan | +5 |
| Juara lomba / prestasi | +30 |
| Tidak hadir tanpa izin | -10 |

**OSIS & MPK:**

| Aksi | EXP |
|------|-----|
| Hadir rapat | +10 |
| Proker selesai tepat waktu | +20 |
| Kontribusi aktif | +5 |
| Tidak hadir rapat tanpa izin | -10 |

> EXP tersimpan di kolom `exp` tabel siswa. Level dihitung otomatis dari total EXP.

---

### 3. Progress Bar

Visual progress menuju level berikutnya.

```typescript
const expPerLevel = [150, 200, 250, 300]
const expUntukLevel = expPerLevel[level - 1]
const expSaatIni = exp % expUntukLevel
const persen = (expSaatIni / expUntukLevel) * 100
```

**Tampil di:**
- Profil siswa
- Leaderboard card
- Dashboard siswa (role siswa)

---

### 4. Pencapaian / Achievement

Admin bisa buat pencapaian baru dengan field:

| Field | Tipe | Keterangan |
|-------|------|------------|
| icon | String | Nama Material Icon |
| nama_pencapaian | String | Nama pencapaian |
| deskripsi | String | Penjelasan |
| exp_reward | Int | EXP yang didapat |
| organisasi | String | Target organisasi |

**Saat pencapaian diberikan:**
- EXP siswa bertambah sesuai `exp_reward`
- Level dicek otomatis
- Email notifikasi ke siswa

---

### 5. Leaderboard (Upgrade)

**Tampilkan:**
- TOP 3 Champions dengan card gold/silver/bronze border
- Ranking #4–#10 dengan progress bar EXP
- Tab per organisasi
- Nama, kelas, level, EXP, foto

> Realtime via Supabase — update otomatis saat EXP berubah

---

### 6. Materi Hari Ini / Pembahasan Rapat

**Programming & English Club** → `Materi Hari Ini`

| Field | Keterangan |
|-------|------------|
| judul | Judul materi |
| deskripsi | Isi / link materi |
| tanggal | Tanggal pertemuan |
| organisasi | Target organisasi |

**OSIS & MPK** → `Pembahasan Rapat`

| Field | Keterangan |
|-------|------------|
| agenda | Agenda rapat |
| notulen | Hasil rapat |
| tanggal | Tanggal rapat |
| lokasi | Lokasi rapat |

---

### 7. Jadwal Pengajar / Jadwal Rapat

**Programming & English Club** → `Jadwal Pengajar`

| Field | Keterangan |
|-------|------------|
| nama_pengajar | Nama pengajar |
| tanggal | Tanggal mengajar |
| materi | Materi yang diajarkan |

**OSIS & MPK** → `Jadwal Rapat`

| Field | Keterangan |
|-------|------------|
| tanggal | Tanggal rapat |
| waktu | Jam mulai |
| lokasi | Tempat rapat |
| agenda | Agenda rapat |
| wajib_hadir | Boolean |

> Notifikasi email H-1 via Vercel Cron

---

### 8. Jabatan Anggota

**Programming & English Club:**
- Ketua Ekskul
- Wakil Ketua
- Anggota Aktif
- Anggota Baru

**OSIS:**
- Ketua Umum
- Wakil Ketua
- Sekretaris
- Bendahara
- Ketua Divisi
- Anggota

**MPK:**
- Ketua MPK
- Wakil Ketua
- Anggota

> Jabatan tampil di: profil siswa, tabel anggota, leaderboard card

---

### 9. Rekap Absensi Per Siswa

**Tampilkan per siswa:**
- Total hadir bulan ini
- Persentase kehadiran
- Streak hadir berturut-turut
- Grafik kehadiran per bulan
- Semua riwayat absensi

**Streak Bonus EXP:**

| Streak | Bonus |
|--------|-------|
| Hadir 3x berturut | +15 EXP |
| Hadir 5x berturut | +30 EXP |
| Hadir 10x berturut | Achievement unlock otomatis |

---

### 10. Kelola EXP Admin

Admin bisa tambah atau kurangi EXP manual per siswa.

**Field input:**

| Field | Keterangan |
|-------|------------|
| siswa_id | Target siswa |
| jumlah | EXP (positif/negatif) |
| alasan | Keterangan perubahan |
| organisasi | Organisasi terkait |

**Semua perubahan tercatat di `exp_log`:**
- Siapa admin yang ubah
- EXP sebelum & sesudah
- Alasan
- Timestamp

---

### 11. Kelola Pencapaian Admin

Admin bisa:
- Tambah pencapaian baru
- Edit pencapaian
- Hapus pencapaian
- Lihat siapa saja penerima pencapaian

**Tampil di tabel:**
`icon` | `nama` | `deskripsi` | `exp_reward` | `aksi`

---

### 12. Berikan Pencapaian ke Anggota

**Langkah:**
1. Admin pilih pencapaian
2. Admin pilih siswa (bisa multiple)
3. Konfirmasi

**Setelah diberikan:**
- EXP siswa + `exp_reward`
- Level dicek otomatis
- Email notifikasi ke siswa
- Muncul di profil siswa
- Tercatat di log

**Validasi:**
> Satu siswa tidak bisa dapat pencapaian yang sama 2x, kecuali admin override

---

## Schema Prisma Baru

```prisma
model Pencapaian {
  id          String   @id @default(cuid())
  icon        String
  nama        String
  deskripsi   String
  exp_reward  Int
  organisasi  String
  createdAt   DateTime @default(now())

  penerima    SiswaPencapaian[]

  @@map("pencapaian")
}

model SiswaPencapaian {
  id            String   @id @default(cuid())
  siswa_id      String
  pencapaian_id String
  tanggal       DateTime @default(now())

  siswa         Siswa      @relation(
    fields: [siswa_id], references: [id]
  )
  pencapaian    Pencapaian @relation(
    fields: [pencapaian_id], references: [id]
  )

  @@unique([siswa_id, pencapaian_id])
  @@map("siswa_pencapaian")
}

model MateriHariIni {
  id         String   @id @default(cuid())
  judul      String
  deskripsi  String
  tanggal    DateTime
  organisasi String
  createdAt  DateTime @default(now())

  @@map("materi_hari_ini")
}

model JadwalKegiatan {
  id           String   @id @default(cuid())
  judul        String
  tanggal      DateTime
  waktu        String
  lokasi       String?
  keterangan   String?
  organisasi   String
  wajib_hadir  Boolean  @default(false)
  createdAt    DateTime @default(now())

  @@map("jadwal_kegiatan")
}

model ExpLog {
  id           String   @id @default(cuid())
  siswa_id     String
  admin_id     String
  exp_sebelum  Int
  exp_sesudah  Int
  selisih      Int
  alasan       String
  organisasi   String
  createdAt    DateTime @default(now())

  @@map("exp_log")
}
```

---

## Aturan Wajib

### 1. Fungsi updateExp() — Wajib untuk semua perubahan EXP

```typescript
async function updateExp(
  siswaId: string,
  selisih: number,
  alasan: string,
  adminId: string,
  organisasi: string
) {
  // 1. Update EXP
  // 2. Cek dan update level
  // 3. Catat di exp_log
  // 4. Trigger email kalau naik level
}
```

> **SEMUA** perubahan EXP wajib lewat fungsi ini. Tidak boleh update langsung ke database.

### 2. Validasi Zod

Semua input **wajib** divalidasi dengan Zod sebelum masuk Prisma.

### 3. Auth Check

Setiap API route **wajib** cek auth Supabase sebelum proses apapun.

### 4. Prisma Transaction

Gunakan `prisma.$transaction()` untuk operasi yang update lebih dari 1 tabel.

### 5. Error Handling

Wajib di setiap service function dengan try/catch.

### 6. Naming Convention

| Type | Convention |
|------|------------|
| File | kebab-case |
| Fungsi | camelCase |
| Tabel | snake_case |
| Komponen | PascalCase |

---

## Yang Tidak Perlu Dibuat Ulang

| Yang Sudah Ada | Keterangan |
|----------------|------------|
| Auth | Sudah pakai Supabase |
| Rate Limiting | Sudah pakai Upstash |
| Email Service | Sudah pakai Resend |
| UI Library | Tetap Tailwind |
| Hosting | Tetap Vercel |

---

## Tips untuk AI

Kalau AI mulai salah arah, ingatkan dengan:

```
"Ingat, sistem ini pakai:
 Next.js + Prisma + Neon (PostgreSQL)
 Bukan Express + MongoDB"
```

Kalau AI mau ubah schema yang sudah ada:

```
"Jangan ubah model yang sudah ada.
 Hanya tambahkan model baru
 yang belum ada di schema."
```

Kalau AI lupa konteks:

```
"Baca ulang bagian KONTEKS SISTEM
 dan ATURAN WAJIB sebelum melanjutkan."
```

---

*SKARLAKE v18.5.0 Artemis Series (Stable)*
*Sistem Manajemen Ekstrakurikuler*
