# 🔧 INSTRUKSI DEBUG: Bug Kehilangan Data Absensi OSIS

## 📋 Ringkasan Masalah
Aplikasi manajemen absensi OSIS **kehilangan data parsial** saat pengguna berpindah dari tab "Input" ke tab "Riwayat". Data anggota dengan nomor urut tinggi (nomor 75–83) tidak muncul di tab Riwayat, padahal sudah disimpan di tab Input.

---

## 🎯 Gejala Bug yang Diamati

### **Tab Input:**
- ✅ Menampilkan **83 anggota** dengan benar
- ✅ Footer menunjukkan `Total: 83`
- ✅ Nomor urut terakhir: 83 (Zhirara Munawaroh Firdatya)
- ✅ Data status "Tidak Hadir" tercatat pada nomor urut 77–81
- ✅ Tombol "Simpan Absensi" ditekan → Notifikasi "Absensi OSIS tersimpan!" muncul

### **Tab Riwayat:**
- ❌ Data **terpotong** sebelum nomor 75–83
- ❌ Scrolling berhenti sebelum mencapai data akhir
- ❌ Data "Tidak Hadir" (nomor 77–81) **hilang sepenuhnya**
- ❌ Total record yang tampil **lebih sedikit dari 83**

---

## 🚨 Area Fokus Debugging (Data Integrity ONLY)

### **1️⃣ FASE SAVE: Cek Payload yang Dikirim**

**Tujuan:** Memastikan data lengkap dikirim ke backend saat tombol "Simpan" ditekan.

**Instruksi Teknis:**
```
1. Buka Developer Console (F12) → Tab Console
2. Cari fungsi yang handle click event tombol "Simpan Absensi"
3. Tambahkan console.log SEBELUM request dikirim:
   
   console.log("Payload yang akan dikirim:", payload);
   console.log("Jumlah record:", payload.length);
   
4. Verifikasi:
   ✓ Apakah payload.length === 83?
   ✓ Apakah index 76–82 (nomor urut 77–83) ada di array?
   ✓ Apakah setiap object di index tersebut memiliki:
     - id / nomor_urut
     - nama_anggota
     - status (Hadir/Tidak Hadir/Izin/Sakit)
     - timestamp atau tanggal
   ✓ Apakah status untuk nomor 77–81 adalah "Tidak Hadir"?
```

**Lokasi yang Mungkin:** File JavaScript tempat event handler button "Simpan Absensi" didefinisikan.

---

### **2️⃣ FASE BACKEND: Cek Penerimaan & Penyimpanan Data**

**Tujuan:** Memastikan semua 83 record diterima dan disimpan di database dengan benar.

**Instruksi Teknis:**

#### **A. Cek Endpoint Save di Backend:**
```
1. Buka file route/controller yang handle POST request untuk simpan absensi
2. Tambahkan logging di awal handler:
   
   console.log("Data diterima dari frontend:", req.body);
   console.log("Jumlah record:", req.body.length);
   
3. Verifikasi:
   ✓ Apakah semua 83 object sampai ke server?
   ✓ Apakah ada record yang hilang di tengah atau di akhir?
   ✓ Apakah ada validasi atau filter yang membuang data?
```

#### **B. Cek Database Directly:**
```
1. Buka database management tool (MySQL Workbench, phpMyAdmin, DBeaver, dll)
2. Query table absensi untuk tanggal 05/06/2026:
   
   SELECT COUNT(*) FROM absensi WHERE tanggal = '2026-06-05';
   SELECT * FROM absensi WHERE tanggal = '2026-06-05' ORDER BY nomor_urut DESC LIMIT 10;
   
3. Verifikasi:
   ✓ Apakah jumlah total row === 83?
   ✓ Apakah nomor_urut 77–83 ada di database?
   ✓ Apakah status untuk nomor_urut 77–81 adalah "Tidak Hadir"?
   ✓ Apakah ada data yang corrupt atau NULL?
```

#### **C. Cek Response Endpoint Save:**
```
1. Buka Network Tab (F12 → Network)
2. Tekan tombol "Simpan Absensi" dan tangkap request POST
3. Lihat Response JSON:
   
   {
     "status": "success",
     "message": "...",
     "saved_count": ???,  ← Harus 83
     "errors": [...]
   }
   
4. Verifikasi:
   ✓ Apakah saved_count === 83?
   ✓ Apakah ada error array yang berisi nomor_urut mana saja yang gagal?
```

---

### **3️⃣ FASE FETCH: Cek Pengambilan Data Riwayat**

**Tujuan:** Memastikan API history mengembalikan semua 83 record tanpa terpotong.

**Instruksi Teknis:**

#### **A. Inspeksi Request GET Riwayat:**
```
1. Buka Network Tab saat membuka/reload tab "Riwayat"
2. Cari request GET ke endpoint history/riwayat
3. Periksa URL dan Query Parameters:
   
   GET /api/history?date=2026-06-05&limit=50&offset=0
   
4. Verifikasi:
   ✓ Apakah ada parameter limit/offset/page yang membatasi?
   ✓ Apakah nilai limit terlalu kecil (misal hanya 50)?
   ✓ Apakah offset/page logic benar untuk menampilkan semua data?
   ✓ Apakah parameter pagination hardcoded atau dynamic?
```

#### **B. Inspeksi Response GET Riwayat:**
```
1. Lihat Response JSON dari request history:
   
   {
     "data": [
       { nomor_urut: 1, nama: "...", status: "..." },
       { nomor_urut: 2, nama: "...", status: "..." },
       ...
       // Apakah berhenti di nomor_urut berapa?
     ],
     "total": ???,  ← Harus 83
     "count": ???   ← Harus 83
   }
   
2. Verifikasi:
   ✓ Apakah array.length === 83?
   ✓ Apakah elemen terakhir adalah nomor_urut 83?
   ✓ Apakah ada nomor_urut yang hilang di tengah-tengah?
   ✓ Apakah field "total" atau "count" menunjukkan angka yang benar?
```

#### **C. Cek Endpoint GET di Backend:**
```
1. Buka file route/controller yang handle GET request untuk history
2. Tambahkan logging:
   
   const data = await db.query("SELECT * FROM absensi WHERE tanggal = ?");
   console.log("Data dari DB:", data.length);
   console.log("Data terakhir:", data[data.length - 1]);
   
3. Verifikasi:
   ✓ Apakah query ke database mengembalikan 83 row?
   ✓ Apakah ada LIMIT clause yang membatasi hasil?
   ✓ Apakah sorting/ordering benar (ORDER BY nomor_urut)?
```

---

### **4️⃣ FASE FRONTEND: Cek Rendering Data Riwayat**

**Tujuan:** Memastikan logika rendering di frontend menampilkan semua data tanpa artificial limit.

**Instruksi Teknis:**

#### **A. Jika Menggunakan Virtual Scroller / Infinite Scroll:**
```
1. Cari komponen virtual scroller di kode (misal: react-window, virtuoso, dll)
2. Cek property itemCount atau totalCount:
   
   <VirtualScroller
     itemCount={data.length}  ← Harus 83
     itemSize={50}
     ...
   >
   
3. Verifikasi:
   ✓ Apakah itemCount diambil dari response API atau hardcoded?
   ✓ Apakah nilainya selalu 83 setelah fetch?
   ✓ Apakah ada offset yang menyebabkan item terpotong?
```

#### **B. Cek Loop Rendering:**
```
1. Cari tempat array data di-render (map, forEach, loop, dll):
   
   {data.map((item, index) => (
     <div key={item.id}>
       {item.nama} - {item.status}
     </div>
   ))}
   
2. Verifikasi:
   ✓ Apakah loop berjalan dari index 0 sampai data.length - 1?
   ✓ Apakah ada kondisi yang memberhentikan loop lebih awal?
   ✓ Apakah ada filter/slice yang mengurangi data sebelum render?
```

#### **C. Cek State Management:**
```
1. Jika menggunakan State (React, Vue, dll):
   
   const [historyData, setHistoryData] = useState([]);
   
   // Saat fetch selesai:
   setHistoryData(response.data);
   console.log("Data di state:", historyData.length);
   
2. Verifikasi:
   ✓ Apakah state berisi semua 83 data setelah fetch?
   ✓ Apakah ada mutation yang mengurangi data sebelum render?
   ✓ Apakah effect/watcher yang trigger rendering berfungsi?
```

---

## ⚠️ BATASAN PERBAIKAN

### **✅ BOLEH DILAKUKAN:**
- ✓ Menambah `console.log` untuk debugging
- ✓ Memodifikasi query database untuk memastikan semua data terambil
- ✓ Menghapus limit/offset yang artificial pada endpoint GET
- ✓ Memperbaiki property `itemCount` pada virtual scroller
- ✓ Memperbaiki filter/slice yang salah pada array rendering
- ✓ Memperbaiki logic sorting atau ordering di backend
- ✓ Menambah parameter pagination yang sesuai

### **❌ DILARANG DILAKUKAN:**
- ✗ Mengubah CSS, warna, border, padding, margin, font
- ✗ Mengubah struktur HTML atau nama class
- ✗ Menambah fitur baru (seperti export, import, filter baru)
- ✗ Mengubah UX flow atau alur aplikasi
- ✗ Menambah animasi atau transisi
- ✗ Mengubah layout atau positioning elemen

---

## 📊 Hasil yang Diharapkan Setelah Perbaikan

### **Tab Input (tetap sama):**
- Menampilkan 83 anggota
- Total: 83
- Data dengan status "Tidak Hadir" (nomor 77–81) terlihat

### **Tab Riwayat (HARUS diperbaiki):**
- ✅ Menampilkan **SEMUA 83 anggota** tanpa terpotong
- ✅ Scrolling dapat mencapai nomor urut 83 (Zhirara Munawaroh Firdatya)
- ✅ Data "Tidak Hadir" (nomor 77–81) **MUNCUL** di riwayat
- ✅ Setiap status di Riwayat **IDENTIK** dengan status di Input
- ✅ Tidak ada data yang hilang, duplikat, atau corrupt

---

## 🔗 Checklist Debugging

- [ ] **Save Phase:** Payload 83 record dikirim ke backend
- [ ] **Backend Response:** saved_count = 83, no errors
- [ ] **Database:** 83 row tersimpan untuk tanggal 05/06/2026, nomor_urut 77–83 ada
- [ ] **Fetch Response:** Array berisi 83 object, total = 83
- [ ] **Frontend State:** data.length === 83 setelah fetch
- [ ] **Rendering:** Semua 83 item tampil tanpa virtual limit yang artificial
- [ ] **Verification:** Scrolling hingga akhir, nomor 77–81 status "Tidak Hadir" visible

---

## 📝 Catatan Penting

1. **Jangan asumsikan**, selalu verifikasi dengan `console.log` dan Network Tab
2. **Periksa setiap fase** (save → backend → database → fetch → render) secara berurutan
3. **Fokus pada data**, bukan visual styling
4. **Gunakan nilai 83** sebagai baseline untuk semua pengecekan
5. **Kolaborasi:** Jika bug terjadi di backend, koordinasikan dengan tim backend

---

## 💡 Tips Debugging Cepat

| Fase | Tool | Yang Dicek |
|------|------|-----------|
| Save | Console | `console.log(payload.length)` |
| Backend | Console/Log | Request data received count |
| Database | SQL Query | `SELECT COUNT(*) FROM absensi WHERE tanggal = '2026-06-05'` |
| Fetch | Network Tab | Response data length dan total field |
| Render | React DevTools / Vue DevTools | State array length |

---

**Selesai** ✅ Kirim file ini ke AI Gemini bersama screenshot atau kode sumber yang problematic.
