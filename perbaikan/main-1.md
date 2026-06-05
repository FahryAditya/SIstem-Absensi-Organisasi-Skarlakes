# Perbaikan Bug Absensi, Kas OSIS & Export Excel

## Ringkasan Masalah

Berdasarkan analisis kode dan laporan [main-1.md](file:///c:/Users/ACER/Desktop/Sistem Ekstrakurikuler/perbaikan/main-1.md):

1. **Data selain "Hadir" tidak muncul setelah simpan** — Saat admin input absensi dengan status Tidak Hadir/Sakit/Izin lalu menyimpan, riwayat hanya menampilkan siswa berstatus "Hadir". Nama juga tidak muncul lengkap A-Z.
2. **Urutan nama di Excel tidak terurut A-Z** — Export Excel menampilkan nama yang tidak tersortir secara konsisten.

---

## Analisis Akar Masalah

### Bug #1: Data Riwayat Hanya Menampilkan "Hadir"

Setelah menelusuri kode secara menyeluruh:

- **Frontend** ([AbsensiClient.tsx](file:///c:/Users/ACER/Desktop/Sistem Ekstrakurikuler/app/absensi/AbsensiClient.tsx)): State `bulkRows` dikelola dengan benar. Fungsi `updateRow()` (L100-102) dan `setAllStatus()` (L104-106) mengubah status per baris dengan benar. Payload dikirim ke API via `handleSave()` (L108-126) menggunakan `bulkRows.map(r => ({ siswa_id: r.siswa_id, status: r.status, ... }))`.

- **Backend API** ([route.ts](file:///c:/Users/ACER/Desktop/Sistem Ekstrakurikuler/app/api/absensi/route.ts)): Validasi schema (L96-104) menerima `z.enum(['hadir', 'tidak_hadir', 'izin', 'sakit'])`. Upsert di L148-152 menyimpan status dengan benar.

- **🔴 Masalah ditemukan — Riwayat GET (L81-92)**: Query mengambil data dari tabel `absensi` dengan pagination `PAGE_SIZE = 20`. **Tetapi**, `limit` di GET default ke `100` (L24). Masalah sebenarnya adalah:
  1. **Halaman riwayat memfilter berdasarkan tanggal dan ekskul**, tapi pagination `PAGE_SIZE = 20` di frontend membatasi tampilan. Jika ada >20 siswa, siswa selebihnya tidak terlihat tanpa pindah halaman.
  2. **Urutan data riwayat**: `orderBy: [{ tanggal: 'desc' }, { siswa: { nama: 'asc' } }]` sudah benar secara prinsip.
  
- **🔴 Masalah utama — Caching**: Setelah menyimpan, `clearJsonCache()` dipanggil (L122), lalu mode berubah ke `'riwayat'` (L124). Namun fungsi `loadRiwayat()` menggunakan `fetchJsonCachedUrl` yang **bisa mengembalikan data cache lama** jika cache belum benar-benar di-clear saat `loadRiwayat` dipanggil. `staleTime: 60_000` (1 menit) berarti data bisa stale. Perlu dipastikan fetch riwayat setelah save benar-benar fresh.

- **🔴 Kemungkinan lain — Tanggal**: Pada API POST, `tanggalDate = new Date(tanggal)` (L113) tanpa timezone suffix. Sementara pada GET riwayat, filter menggunakan `new Date(tanggal + 'T00:00:00')` dan `new Date(tanggal + 'T23:59:59')`. Jika POST menyimpan tanggal dengan timezone berbeda, maka GET tidak akan menemukan data tersebut. Karena kolom `tanggal` bertipe `@db.Date` (date only, tanpa time), Prisma bisa menyimpan tanggal yang shifted. **Ini adalah akar masalah utama.**

  Contoh: `new Date('2026-06-05')` di timezone WIB (+7) menghasilkan `2026-06-04T17:00:00Z`. Saat disimpan ke kolom `DATE`, PostgreSQL menyimpannya sebagai `2026-06-04`. Lalu saat GET memfilter `tanggal >= 2026-06-05T00:00:00 AND tanggal <= 2026-06-05T23:59:59`, record `2026-06-04` tidak cocok!

  Namun ini seharusnya mempengaruhi SEMUA record (termasuk Hadir). **Kecuali** jika record yang muncul adalah dari input sebelumnya yang tersimpan pada tanggal yang benar.

Setelah analisis lebih lanjut, masalah paling mungkin adalah kombinasi:
1. **Cache stale** — setelah save, data riwayat masih dari cache lama
2. **Semua nama tidak muncul karena PAGE_SIZE = 20** — harus menampilkan semua atau meningkatkan limit

### Bug #2: Urutan Nama di Excel Tidak A-Z

Di [export route.ts](file:///c:/Users/ACER/Desktop/Sistem Ekstrakurikuler/app/api/export/route.ts):
- `buildAbsensiRows()` (L62-117): Menggunakan `orderBy: [{ tanggal: 'asc' }, { siswa: { nama: 'asc' } }]` — ini mengurutkan berdasarkan tanggal dulu, baru nama. Jika user ingin urutan A-Z (nama duluan), perlu sort ulang setelah data dikumpulkan.
- `buildKasRows()` (L119-195): Sama, orderBy tanggal dulu.
- `buildKehadiranRows()` (L197-258): Sudah `orderBy: { nama: 'asc' }` — ini sudah benar.
- **Masalah**: Saat data dari multiple orgs digabung, rows di-push berurutan per org tanpa final sort. Hasil akhir hanya A-Z per org, bukan A-Z secara keseluruhan.

Perlu menambahkan **final sort by Nama** pada setiap fungsi builder sebelum mengembalikan rows.

---

## Proposed Changes

### Komponen 1: Absensi API (Backend)

#### [MODIFY] [route.ts](file:///c:/Users/ACER/Desktop/Sistem Ekstrakurikuler/app/api/absensi/route.ts)

1. **Fix tanggal POST**: Pastikan tanggal yang disimpan menggunakan format konsisten dengan menambahkan suffix `T00:00:00` agar tidak terjadi timezone shift.
2. **Increase limit pada riwayat query**: Pastikan semua data pada tanggal tertentu muncul (tidak terpotong pagination backend).

---

### Komponen 2: Absensi Client (Frontend) 

#### [MODIFY] [AbsensiClient.tsx](file:///c:/Users/ACER/Desktop/Sistem Ekstrakurikuler/app/absensi/AbsensiClient.tsx)

1. **Force fresh fetch setelah save**: Ubah `loadRiwayat` agar menggunakan `force: true` untuk bypass cache setelah save.
2. **Naikkan PAGE_SIZE atau gunakan limit lebih besar**: Agar semua siswa muncul pada satu halaman riwayat per tanggal.

---

### Komponen 3: Export API

#### [MODIFY] [route.ts](file:///c:/Users/ACER/Desktop/Sistem Ekstrakurikuler/app/api/export/route.ts)

1. **Sort final rows by Nama A-Z** di `buildAbsensiRows()` dan `buildKasRows()` sebelum return.
2. **Re-number "No" column** setelah sort agar urutan nomor tetap konsisten.

---

## Verification Plan

### Manual Verification
1. Input absensi dengan campuran status (Hadir, Tidak Hadir, Izin, Sakit) lalu simpan
2. Periksa di tab Riwayat apakah semua nama muncul dengan status yang benar
3. Export Excel dan periksa urutan nama A-Z
4. Pastikan semua nama muncul lengkap di riwayat (bukan hanya 20 pertama)
