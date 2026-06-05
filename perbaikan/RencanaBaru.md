# 📋 RENCANA APLIKASI PENGELOMPOKAN KEGIATAN OSIS

## 🎯 Overview
Aplikasi untuk mengelompokkan siswa ke berbagai kegiatan OSIS dengan sistem filtering, kategorisasi, dan visualisasi data berdasarkan jenis kegiatan dan organisasi.

---

## 📊 Input Data

### **Sumber Data:**
- ✅ Ambil data siswa dari database
- ✅ Judul Kegiatan (dropdown selection)

### **Jenis Kegiatan (Dropdown Menu):**
```
1. Rapat
2. Jumat Seni
3. Jumat Religius
4. Jumat Sehat
5. Petugas Upacara
6. Panitia (Bisa Costume)
7. Piket Kebersihan & Penyambutan
```

---

## 🏗️ Struktur Pengelompokan

### **Kategori Utama:**

#### **1. PIKET (Penyambutan & Kebersihan)**
Tipe: Gabungan dengan kolom terpisah

| Nama | Kelas | Organisasi | Sub-Piket |
|------|-------|-----------|-----------|
| Siswa 1 | X IPA 1 | OSIS / MPK | Penyambutan |
| Siswa 2 | X IPA 2 | OSIS / MPK | Kebersihan |
| Siswa 3 | X IPS 1 | OSIS / MPK | Penyambutan |

**Kolom Terpisah:**
- Nama
- Kelas
- Organisasi (dengan warna kode)
- Sub-Piket (Penyambutan / Kebersihan)

---

#### **2. PANITIA (Berdasarkan Jenis Lomba/Kegiatan)**
Tipe: Dinamis sesuai nama kegiatan (bisa Costume atau non-Costume)

**Contoh Format:**

##### **Panitia Lomba Lari**
| No | Nama | Kelas | Organisasi |
|-------|------|-------|-----------|
| 1 | Siswa A | XI IPA 1 | OSIS |
| 2 | Siswa B | XI IPA 2 | MPK |
| 3 | Siswa C | XI IPS 1 | OSIS |
| 4 | Siswa D | XI IPS 2 | MPK |
| 5 | Siswa E | XII IPA 1 | OSIS |

##### **Panitia Lomba Costume**
| No | Nama | Kelas | Organisasi |
|-------|------|-------|-----------|
| 1 | Siswa X | X IPA 1 | OSIS |
| 2 | Siswa Y | X IPA 2 | MPK |
| 3 | Siswa Z | X IPS 1 | OSIS |
| 4 | Siswa W | X IPS 2 | MPK |
| 5 | Siswa V | XI IPA 1 | MPK |

---

## 🎨 Spesifikasi Visual (UI/UX)

### **Header Section:**
```
┌─────────────────────────────────────────┐
│  PENGELOMPOKAN KEGIATAN OSIS            │
│                                         │
│  Pilih Kegiatan: [Dropdown ▼]          │
│  - Rapat                               │
│  - Jumat Seni                          │
│  - Jumat Religius                      │
│  - Jumat Sehat                         │
│  - Petugas Upacara                     │
│  - Panitia (Costume)                   │
│  - Piket Kebersihan & Penyambutan      │
└─────────────────────────────────────────┘
```

---

### **Output Format A: PANITIA**

```
╔═══════════════════════════════════════════════════════════╗
║  PANITIA: Lomba Lari                                      ║
╠═══════════════════════════════════════════════════════════╣
║ No │ Nama                 │ Kelas      │ Organisasi       ║
╠════╪══════════════════════╪════════════╪══════════════════╣
║ 1  │ Ahmad Rifki         │ XI IPA 1   │ 🔵 OSIS         ║
║ 2  │ Budi Santoso        │ XI IPA 2   │ 🔴 MPK          ║
║ 3  │ Citra Dewi          │ XI IPS 1   │ 🔵 OSIS         ║
║ 4  │ Desy Oktavia        │ XI IPS 2   │ 🔴 MPK          ║
║ 5  │ Eka Putra           │ XII IPA 1  │ 🔵 OSIS         ║
║ ... │ ...                 │ ...        │ ...              ║
╚════╧══════════════════════╧════════════╧══════════════════╝
```

**Spesifikasi Kolom:**
- **No:** Nomor urut (1, 2, 3, ...)
- **Nama:** Nama siswa (string)
- **Kelas:** Kelas siswa (X/XI/XII + IPA/IPS + nomor)
- **Organisasi:** 
  - 🔵 **OSIS** (Warna Biru: #3D3DB8)
  - 🔴 **MPK** (Warna Merah: #DC143C)

---

### **Output Format B: PIKET (Penyambutan & Kebersihan)**

```
╔════════════════════════════════════════════════════════════════════════╗
║  PIKET: Penyambutan & Kebersihan                                       ║
╠════════════════════════════════════════════════════════════════════════╣
║                     PENYAMBUTAN                                        ║
╠════════════════════════════════════════════════════════════════════════╣
║ No │ Nama                 │ Kelas      │ Organisasi                    ║
╠════╪══════════════════════╪════════════╪═══════════════════════════════╣
║ 1  │ Fathan Aziz         │ X IPA 1    │ 🔵 OSIS                      ║
║ 2  │ Gita Melani         │ X IPA 2    │ 🔴 MPK                       ║
║ 3  │ Hendra Wijaya       │ X IPS 1    │ 🔵 OSIS                      ║
║ 4  │ Indah Permata       │ X IPS 2    │ 🔴 MPK                       ║
║ ... │ ...                 │ ...        │ ...                          ║
╠════════════════════════════════════════════════════════════════════════╣
║                     KEBERSIHAN                                         ║
╠════════════════════════════════════════════════════════════════════════╣
║ No │ Nama                 │ Kelas      │ Organisasi                    ║
╠════╪══════════════════════╪════════════╪═══════════════════════════════╣
║ 1  │ Joko Prasetyo       │ XI IPA 1   │ 🔵 OSIS                      ║
║ 2  │ Katarina Putri      │ XI IPA 2   │ 🔴 MPK                       ║
║ 3  │ Luki Ramadhan       │ XI IPS 1   │ 🔵 OSIS                       ║
║ 4  │ Maya Handoko        │ XI IPS 2   │ 🔴 MPK                       ║
║ ... │ ...                 │ ...        │ ...                          ║
╚════╧══════════════════════╧════════════╧═══════════════════════════════╝
```

**Spesifikasi:**
- ✅ Dua kolom terpisah: **Penyambutan** dan **Kebersihan**
- ✅ Setiap kolom memiliki nomor urut sendiri (1, 2, 3, ...)
- ✅ Format sama dengan Panitia (Nama, Kelas, Organisasi)
- ✅ Organisasi ditampilkan dengan warna kode

---

## 🎨 Warna Kode Organisasi

| Organisasi | Warna | Hex Code | RGB |
|-----------|-------|----------|-----|
| OSIS | Biru | #3D3DB8 | rgb(61, 61, 184) |
| MPK | Merah | #DC143C | rgb(220, 20, 60) |

### **Implementasi:**
```html
<!-- OSIS -->
<span style="color: #3D3DB8; font-weight: bold;">● OSIS</span>

<!-- MPK -->
<span style="color: #DC143C; font-weight: bold;">● MPK</span>
```

---

## 📱 Flow Aplikasi

### **Step 1: Pilih Kegiatan**
```
User membuka aplikasi
    ↓
Lihat dropdown "Pilih Kegiatan"
    ↓
Pilih salah satu:
- Rapat
- Jumat Seni
- Jumat Religius
- Jumat Sehat
- Petugas Upacara
- Panitia (Costume)
- Piket Kebersihan & Penyambutan
```

### **Step 2: Sistem Pengelompokan**

#### **Jika Pilih "Piket Kebersihan & Penyambutan":**
```
Kegiatan: Piket
    ├─ Penyambutan
    │  ├─ Siswa 1 (OSIS)
    │  ├─ Siswa 2 (MPK)
    │  ├─ Siswa 3 (OSIS)
    │  └─ ...
    │
    └─ Kebersihan
       ├─ Siswa X (OSIS)
       ├─ Siswa Y (MPK)
       ├─ Siswa Z (OSIS)
       └─ ...
```

#### **Jika Pilih "Panitia (Costume)" atau Panitia lainnya:**
```
Kegiatan: Panitia Lomba Lari
    ├─ Siswa A (OSIS)
    ├─ Siswa B (MPK)
    ├─ Siswa C (OSIS)
    └─ ...

Kegiatan: Panitia Lomba Costume
    ├─ Siswa X (OSIS)
    ├─ Siswa Y (MPK)
    ├─ Siswa Z (OSIS)
    └─ ...
```

---

## 💾 Struktur Data Backend

### **Database Schema:**

#### **Tabel: kegiatan**
```sql
CREATE TABLE kegiatan (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama_kegiatan VARCHAR(100) NOT NULL,
  tipe ENUM('panitia', 'piket', 'petugas', 'rapat') NOT NULL,
  tanggal DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data Sample:
INSERT INTO kegiatan VALUES
(1, 'Piket Kebersihan & Penyambutan', 'piket', '2026-06-05', NOW()),
(2, 'Panitia Lomba Lari', 'panitia', '2026-06-05', NOW()),
(3, 'Panitia Lomba Costume', 'panitia', '2026-06-05', NOW()),
(4, 'Jumat Seni', 'rapat', '2026-06-05', NOW()),
(5, 'Petugas Upacara', 'petugas', '2026-06-05', NOW());
```

#### **Tabel: pengelompokan_kegiatan**
```sql
CREATE TABLE pengelompokan_kegiatan (
  id INT PRIMARY KEY AUTO_INCREMENT,
  kegiatan_id INT NOT NULL,
  siswa_id INT NOT NULL,
  organisasi ENUM('OSIS', 'MPK') NOT NULL,
  sub_kategori VARCHAR(50), -- Untuk piket: "Penyambutan" atau "Kebersihan"
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kegiatan_id) REFERENCES kegiatan(id),
  FOREIGN KEY (siswa_id) REFERENCES siswa(id)
);

-- Data Sample:
INSERT INTO pengelompokan_kegiatan VALUES
(1, 1, 5, 'OSIS', 'Penyambutan', NOW()),
(2, 1, 12, 'MPK', 'Penyambutan', NOW()),
(3, 1, 8, 'OSIS', 'Kebersihan', NOW()),
(4, 1, 15, 'MPK', 'Kebersihan', NOW()),
(5, 2, 3, 'OSIS', NULL, NOW()),
(6, 2, 10, 'MPK', NULL, NOW()),
(7, 3, 7, 'OSIS', NULL, NOW()),
(8, 3, 14, 'MPK', NULL, NOW());
```

#### **Tabel: siswa** (existing)
```sql
CREATE TABLE siswa (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama VARCHAR(100) NOT NULL,
  kelas VARCHAR(20) NOT NULL, -- Contoh: X IPA 1, XI IPS 2
  nisn VARCHAR(20) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 Fitur Aplikasi

### **Feature 1: Dropdown Kegiatan**
- [ ] Menampilkan list kegiatan dari database
- [ ] Trigger rendering data saat dipilih
- [ ] Support multiple kegiatan untuk selection

### **Feature 2: Pengelompokan Dinamis**
- [ ] Jika kegiatan = "Piket", tampilkan 2 kolom (Penyambutan + Kebersihan)
- [ ] Jika kegiatan = "Panitia", tampilkan 1 kolom dengan data panitia
- [ ] Jika kegiatan lainnya, tampilkan 1 kolom dengan format standar

### **Feature 3: Warna Kode Organisasi**
- [ ] OSIS = Biru (#3D3DB8)
- [ ] MPK = Merah (#DC143C)
- [ ] Terapkan pada text atau badge di kolom Organisasi

### **Feature 4: Sorting & Filtering**
- [ ] Sort berdasarkan Nama (A-Z)
- [ ] Sort berdasarkan Kelas
- [ ] Filter berdasarkan Organisasi (OSIS/MPK)

### **Feature 5: Export Data**
- [ ] Export ke PDF
- [ ] Export ke Excel dengan format sesuai pengelompokan

---

## 📐 Contoh Data Lengkap

### **Kegiatan: Piket Kebersihan & Penyambutan**

#### **Kolom Penyambutan:**
| No | Nama | Kelas | Organisasi |
|----|------|-------|-----------|
| 1 | Ahmad Rifki | X IPA 1 | 🔵 OSIS |
| 2 | Budi Santoso | X IPA 2 | 🔴 MPK |
| 3 | Citra Dewi | X IPS 1 | 🔵 OSIS |
| 4 | Desy Oktavia | X IPS 2 | 🔴 MPK |

#### **Kolom Kebersihan:**
| No | Nama | Kelas | Organisasi |
|----|------|-------|-----------|
| 1 | Eka Putra | XI IPA 1 | 🔵 OSIS |
| 2 | Fathan Aziz | XI IPA 2 | 🔴 MPK |
| 3 | Gita Melani | XI IPS 1 | 🔵 OSIS |
| 4 | Hendra Wijaya | XI IPS 2 | 🔴 MPK |

---

### **Kegiatan: Panitia Lomba Lari**

| No | Nama | Kelas | Organisasi |
|----|------|-------|-----------|
| 1 | Indah Permata | XII IPA 1 | 🔵 OSIS |
| 2 | Joko Prasetyo | XII IPA 2 | 🔴 MPK |
| 3 | Katarina Putri | XII IPS 1 | 🔵 OSIS |
| 4 | Luki Ramadhan | XII IPS 2 | 🔴 MPK |
| 5 | Maya Handoko | X IPA 1 | 🔵 OSIS |

---

## 📋 Checklist Implementasi

- [ ] **Backend Setup**
  - [ ] Buat 3 tabel (kegiatan, pengelompokan_kegiatan, siswa)
  - [ ] Insert sample data kegiatan
  - [ ] Create API endpoint GET /kegiatan
  - [ ] Create API endpoint GET /kegiatan/:id/pengelompokan

- [ ] **Frontend Setup**
  - [ ] Build dropdown component untuk kegiatan
  - [ ] Build table component untuk penampilan data
  - [ ] Implementasi warna kode organisasi
  - [ ] Responsive design

- [ ] **Feature Implementation**
  - [ ] Conditional rendering (piket vs panitia)
  - [ ] Data sorting & filtering
  - [ ] Export functionality

- [ ] **Testing**
  - [ ] Test dengan data piket (2 kolom)
  - [ ] Test dengan data panitia (1 kolom)
  - [ ] Verifikasi warna OSIS & MPK
  - [ ] Test export PDF & Excel

---

## 🎓 Dokumentasi Tambahan

- **Tech Stack yang Disarankan:** 
  - Frontend: React/Vue/Next.js
  - Backend: Node.js/Express atau PHP/Laravel
  - Database: MySQL
  - Styling: TailwindCSS atau Bootstrap

- **File Struktur:**
  ```
  project/
  ├── frontend/
  │   ├── components/
  │   │   ├── DropdownKegiatan.jsx
  │   │   ├── TabelPengelompokan.jsx
  │   │   └── BadgeOrganisasi.jsx
  │   ├── pages/
  │   │   └── Pengelompokan.jsx
  │   └── styles/
  │       └── pengelompokan.css
  ├── backend/
  │   ├── routes/
  │   │   └── kegiatan.js
  │   ├── controllers/
  │   │   └── kegiatanController.js
  │   ├── models/
  │   │   └── kegiatan.model.js
  │   └── database.sql
  └── README.md
  ```

---

**Selesai ✅** Dokumen rencana siap untuk development!