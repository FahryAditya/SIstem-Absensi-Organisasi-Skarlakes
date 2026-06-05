# Laporan Analisis Bug & Rencana Perbaikan Sistem Absensi OSIS

Dokumen ini berisi catatan masalah (bug) yang ditemukan pada sistem absensi berdasarkan rekaman simulasi `kesalahan.mp4` tertanggal **5 Juni 2026**, beserta analisis teknis dan panduan perbaikannya.

---

## 📌 Ringkasan Masalah (Bug List)

| No | Masalah | Lokasi | Dampak | Prioritas |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Status selain "Hadir" tidak tersimpan | Tab Input $\rightarrow$ Database | Data tidak valid (semua dianggap Hadir) | **CRITICAL** |
| 2 | Bug Tanggal Tidak Valid (Format "75 Juni 2026") | Fitur Ekspor Excel | Laporan rusak & tidak dapat digunakan | **HIGH** |
| 3 | Duplikasi Data Masif (*Duplicate Rows*) | Fitur Ekspor Excel | Ukuran file membengkak & data inkonsisten | **HIGH** |
| 4 | Urutan Nama Tidak Sinkron (*Sorting*) | Tab Riwayat & Excel | Menyulitkan verifikasi manual | **LOW** |

---

## 🛠 Detail Masalah & Rencana Perbaikan (Action Plan)

### 1. Masalah Payload / State Input Tidak Tersimpan
* **Deskripsi:** Ketika admin mengubah status anggota menjadi **"Tidak Idn"** atau **"Sakit"** (misal: Silvi Andini, Siti Azahra), status tersebut kembali menjadi **"Hadir"** setelah halaman dimuat ulang di tab Riwayat.
* **Penyebab:** * Frontend tidak mengirimkan *state* terbaru dari radio button/toggle saat tombol "Simpan Absensi" ditekan (mengirimkan nilai default).
  * Atau, Backend FastAPI tidak melakukan update data secara benar pada query SQL/NoSQL untuk status non-hadir.
* **Solusi Perbaikan:**
  * Pastikan fungsi `onChange` pada komponen radio button mengubah *state* array data kelompok anggota.
  * Periksa struktur JSON Payload yang dikirim ke backend. Pastikan formatnya sudah benar, contoh:
    ```json
    {
      "user_id": "80",
      "status": "Tidak Idn"
    }
    ```

### 2. Bug Logika "Tanggal 75 Juni 2026" di Excel
* **Deskripsi:** Pada baris 64 ke bawah di file Excel, kolom tanggal menampilkan teks tidak masuk akal seperti "75 Juni 2026", "74 Juni 2026", dst.
* **Penyebab:** Terjadi *Logic Error* pada fungsi perulangan (*looping generator*) file Excel. Variabel `index` perulangan baris secara tidak sengaja ter-render ke dalam string format tanggal menggantikan variabel hari (`day`).
* **Solusi Perbaikan:**
  * Cari fungsi eksportir Excel di backend/frontend.
  * Koreksi variabel di dalam *looping*. Pastikan variabel tanggal mengambil objek tanggal yang valid dari database, bukan dari *counter/index* perulangan.
  * *Contoh kesalahan:* `cell.value = f"{index} Juni 2026"` 
  * *Perbaikan:* `cell.value = data.tanggal.strftime("%d %B %Y")`

### 3. Duplikasi Baris Data Anggota pada Excel
* **Deskripsi:** Satu nama anggota muncul berkali-kali secara berurutan pada tanggal yang sama di hasil unduhan Excel.
* **Penyebab:** Kesalahan pada query pengambilan data (`SELECT`) yang tidak melakukan filter secara spesifik atau adanya penumpukan fungsi `append()` di dalam nested loop saat menyusun baris Excel.
* **Solusi Perbaikan:**
  * Jalankan evaluasi query database. Jika menggunakan SQL, pastikan tidak terjadi *Cartesian Product* akibat `JOIN` yang salah. Gunakan query yang spesifik berdasarkan `tanggal_absensi`.
  * Pastikan array/list menampung data yang bersih sebelum di-mapping ke baris spreadsheet.

### 4. Inkonsistensi Pengurutan Nama (*Sorting*)
* **Deskripsi:** Urutan nama di tab Input (A-Z) tidak sama dengan urutan nama di tab Riwayat maupun file Excel.
* **Penyebab:** Tidak adanya parameter `ORDER BY` atau fungsi `.sort()` yang seragam di setiap *endpoint* pencarian data.
* **Solusi Perbaikan:**
  * Standarisasikan pengurutan data berdasarkan nama alfabetis (`nama ASC`) di semua level: Query Database, State Frontend, dan Fungsi Ekspor Excel.

---

## 📅 Target Penyelesaian
Perbaikan ini bersifat mendesak karena merusak fungsi utama aplikasi (*core functionality*). Diharapkan *hotfix* dapat segera di-deploy setelah logika perulangan pada backend diperbaiki.