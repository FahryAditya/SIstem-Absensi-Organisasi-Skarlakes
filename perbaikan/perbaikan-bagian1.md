# 🛠️ PERBAIKANWEB.MD
## Panduan Perbaikan Non-Teknis Sistem Ekstrakurikuler
**Versi:** 1.0 (Non-Code)  
**Tanggal:** 30 Juni 2026  
**Status:** 🔴 PRIORITAS TINGGI  
**Target Audience:** Project Manager, QA Tester, System Analyst  

> ⚠️ **CATATAN:** Dokumen ini berisi alur logika dan langkah perbaikan. Implementasi teknis diserahkan kepada developer sesuai stack yang digunakan.

---

## 📋 Matriks 5 Masalah Utama

| No | Masalah | Dampak Bisnis | Langkah Perbaikan (Logika) | Output Verifikasi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Session Drop / Unauthorized | User tidak bisa bekerja; fitur tidak bisa diakses | 1. Tambahkan mekanisme perpanjangan sesi otomatis<br>2. Pastikan token dikirim ulang setelah diperbarui<br>3. Paksa logout hanya jika perpanjangan gagal | User tetap login setelah 30 menit tidak aktif |
| 2 | State Bocor Antar Organisasi | Data organisasi A muncul di organisasi B → risiko hapus data salah | 1. Kosongkan semua data halaman SEBELUM memuat data organisasi baru<br>2. Pastikan setiap permintaan data selalu membawa identitas organisasi saat ini | Ganti organisasi → data berubah total dalam <1 detik |
| 3 | Clear Database Type Mismatch | Fitur hapus darurat tidak bisa dipakai | 1. Samakan tipe data konfirmasi antara tampilan dan server<br>2. Wajibkan pembuatan backup otomatis sebelum eksekusi hapus | Konfirmasi hapus berhasil + file backup terbentuk |
| 4 | Absensi & Kas Tidak Persist | Data operasional harian hilang | 1. Pastikan server memberikan respon "berhasil tersimpan" yang jelas<br>2. Periksa apakah filter riwayat sudah menyertakan identitas organisasi | Data absensi/kas tetap ada setelah refresh halaman |
| 5 | Tidak Ada RBAC di Endpoint Kritis | Siswa bisa akses fitur admin via API | 1. Daftarkan semua endpoint sensitif<br>2. Wajibkan pengecekan peran admin sebelum memproses permintaan<br>3. Tolak akses non-admin dengan pesan "Dilarang" | Non-admin mendapat penolakan saat mencoba akses fitur admin |

---

## 🔄 Alur Kerja Perbaikan (SOP)

### Tahap 1: Persiapan (Hari 1 Pagi)
- [ ] Backup database produksi terkini
- [ ] Buat environment staging terpisah untuk testing
- [ ] Dokumentasikan versi sistem saat ini
- [ ] Briefing tim tentang 5 masalah utama dan larangan memperbaiki bug UI dulu

### Tahap 2: Eksekusi Perbaikan (Hari 1–3)
- [ ] Kerjakan masalah #1 (Session) terlebih dahulu karena blocker absolut
- [ ] Lanjut ke masalah #2 (State Isolation) karena risiko data corruption
- [ ] Fix masalah #3 (Clear DB) dan #4 (Persistensi) secara paralel jika tim >1 orang
- [ ] Akhiri dengan masalah #5 (RBAC) sebagai lapisan keamanan terakhir
- [ ] Setiap selesai satu masalah, langsung jalankan checklist verifikasi di environment staging

### Tahap 3: Quality Assurance (Hari 4)
- [ ] Uji skenario lengkap: Login → Ganti Organisasi → Input Absensi → Clear DB → Logout
- [ ] Uji negatif: Coba akses endpoint admin sebagai siswa biasa
- [ ] Uji ketahanan: Diamkan sistem 30+ menit, lalu coba gunakan fitur
- [ ] Validasi backup: Restore backup hasil Clear DB, pastikan data kembali utuh

### Tahap 4: Deployment & Monitoring (Hari 5)
- [ ] Deploy ke production hanya jika semua checklist QA lulus 100%
- [ ] Monitor log error selama 2 jam pertama pasca-deploy
- [ ] Siapkan rollback plan jika muncul masalah baru
- [ ] Update dokumentasi versi sistem dengan catatan perbaikan

---

## ✅ Checklist Verifikasi Final (Definition of Done)

Sebelum menyatakan perbaikan selesai, pastikan SEMUA poin berikut terpenuhi:

### Autentikasi & Sesi
- [ ] Login berhasil tanpa error
- [ ] Setelah 30 menit idle, user masih bisa navigasi tanpa login ulang
- [ ] Logout manual berfungsi normal
- [ ] Token tidak terlihat di URL atau localStorage (jika memungkinkan)

### Integritas Data Organisasi
- [ ] Ganti organisasi → semua halaman (anggota, absensi, kas, XP) menampilkan data yang benar
- [ ] Tidak ada data dari organisasi sebelumnya yang tersisa setelah ganti
- [ ] Input data di organisasi A tidak muncul di organisasi B

### Fitur Kritis
- [ ] Clear Database: konfirmasi teks diterima → backup terbentuk → data terhapus
- [ ] Absensi: input → simpan → refresh → data muncul di riwayat
- [ ] Kas: tambah transaksi → saldo update → riwayat tampil
- [ ] Kelola XP: hanya admin yang bisa memberi XP; non-admin ditolak

### Keamanan Dasar
- [ ] Endpoint `/xp/give`, `/database/clear`, `/members/delete` menolak request non-admin
- [ ] Pesan error tidak membocorkan informasi sensitif (stack trace, query SQL)
- [ ] Backup database bisa di-restore dengan sukses

---

## 📝 Catatan Penting untuk Tim

1.  **Jangan Multitasking Bug:** Fokus selesaikan satu masalah utama sampai tuntas sebelum pindah ke berikutnya.
2.  **Dokumentasikan Setiap Perubahan:** Catat apa yang diubah, mengapa, dan bagaimana cara verifikasinya.
3.  **Komunikasi Proaktif:** Jika menemukan akar masalah berbeda dari dugaan, segera laporkan sebelum melanjutkan perbaikan.
4.  **Testing Manual Wajib:** Jangan andalkan automated test saja; lakukan uji manual sesuai skenario pengguna nyata.
5.  **Backup Adalah Hukum:** Tidak boleh ada perubahan pada data produksi tanpa backup terverifikasi terlebih dahulu.

---

## 📞 Kontak Darurat
Jika terjadi insiden kritis selama proses perbaikan:
- **Lead Developer:** [Nama] - [Kontak]
- **System Admin:** [Nama] - [Kontak]
- **Project Manager:** [Nama] - [Kontak]

> Dokumen ini adalah panduan hidup. Perbarui jika ditemukan informasi baru atau perubahan prioritas.