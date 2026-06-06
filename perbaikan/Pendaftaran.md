# 🎯 DOKUMENTASI FITUR PENDAFTARAN ESKUL & OSIS/MPK

## 📋 Overview
Sistem pendaftaran berbasis QR Code untuk Ekstrakurikuler (English Club, Programming) dan Organisasi (OSIS, MPK) dengan halaman penerimaan peserta dan notifikasi email otomatis.

---

# 🎓 BAGIAN 1: PENDAFTARAN ESKUL (English Club & Programming)

## 1.1 Flow Pendaftaran Eskul

```
┌─────────────────────────────────────────────────────┐
│  Peserta Scan QR Code Pendaftaran Eskul             │
│  (English Club / Programming)                       │
└────────────────┬────────────────────────────────────┘
                 ↓
         ┌───────────────┐
         │ Cek QR Code   │
         │ Validasi      │
         └───────┬───────┘
                 ↓
    ┌────────────────────────────┐
    │ Halaman Form Pendaftaran   │
    │ - Nama                     │
    │ - Kelas                    │
    │ - Kejuruan                 │
    │ - Email Gmail              │
    │ - Submit Button            │
    └────────────┬───────────────┘
                 ↓
    ┌────────────────────────────────┐
    │ Cek Data Duplikat:             │
    │ - Email sudah terdaftar?       │
    │ - NISN sudah terdaftar?        │
    └────────────┬───────────────────┘
                 ↓ (Valid)
    ┌────────────────────────────────────┐
    │ Simpan ke DB: pendaftaran_eskul    │
    │ Status: "Menunggu Penerimaan"      │
    └────────────┬───────────────────────┘
                 ↓
    ┌────────────────────────────────────┐
    │ Tampil Pesan: "Pendaftaran Berhasil│
    │ Tunggu Konfirmasi Admin"           │
    └────────────────────────────────────┘
```

---

## 1.2 Halaman: Form Pendaftaran Eskul

### **URL:** `/eskul/register`

### **QR Code Configuration:**
```
QR Code Content (JSON):
{
  "type": "eskul_registration",
  "program": "programming", // atau "english_club"
  "registration_url": "https://domain.com/eskul/register?program=programming&qr_token=abc123xyz"
}

QR Code Text (Alternative):
https://domain.com/eskul/register?program=programming&qr_token=token_unik_123
```

### **Form Fields:**

| Field | Type | Validasi | Contoh |
|-------|------|----------|---------|
| Nama Lengkap | Text Input | Required, max 100 char | Ahmad Rifki Pratama |
| Kelas | Dropdown | Required | X, XI |
| Kejuruan | Dropdown | Required | DKV, PPLG, MPLB 1, MPLB 2, AKL, TJKT, AKC 1, AKC 2, AKC 3, AKC 4, AKC 5, AKC 6, TLM, FARMASI |
| Email Gmail | Email | Required, unique, must be @gmail.com | ahmad.rifki@gmail.com |
| Program Eskul | Hidden/Display | Auto-filled dari QR | Programming / English Club |

### **Kelas Options:**
```
- X (Kelas 10)
- XI (Kelas 11)
```

### **Kejuruan Options:**

#### **Skarla (SKARLA):**
- DKV
- PPLG
- MPLB 1
- MPLB 2
- AKL
- TJKT

#### ** Skakes (SKAKES):**
- AKC 1
- AKC 2
- AKC 3
- AKC 4
- AKC 5
- AKC 6
- TLM
- FARMASI

### **Form Validation:**
```javascript
// Backend Validation:
1. Nama: tidak boleh kosong, min 5 char, max 100 char
2. Kelas: harus dipilih dari dropdown
3. Kejuruan: harus dipilih dari dropdown
4. Email: 
   - Format valid (@gmail.com required)
   - Belum terdaftar di program yang sama
   - Belum terdaftar di program lain (optional warning)
5. QR Token: valid dan belum expired

// Cegah Duplikat:
SELECT COUNT(*) FROM pendaftaran_eskul 
WHERE email = ? AND program = ? AND status != 'ditolak'
// Jika count > 0: tampil error "Email sudah terdaftar"
```

### **UI/UX Halaman:**
```
┌─────────────────────────────────────────────────────┐
│  📝 FORM PENDAFTARAN ESKUL                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Program: [Programming ▼] (read-only)              │
│                                                     │
│  Nama Lengkap: [________________]                   │
│  *Required, max 100 char                            │
│                                                     │
│  Kelas: [X ▼]                                      │
│  *Required (X atau XI)                             │
│                                                     │
│  Kejuruan: [PPLG ▼]                                │
│  *Required                                          │
│  SKARLA: DKV, PPLG, MPLB 1, MPLB 2, AKL, TJKT     │
│  SKAKES: AKC 1-6, TLM, FARMASI                     │
│                                                     │
│  Email Gmail: [________________@gmail.com]          │
│  *Required, harus @gmail.com, belum terdaftar       │
│                                                     │
│  ┌───────────────────────────────────┐             │
│  │  ✓ Daftar   │   ✗ Batal           │             │
│  └───────────────────────────────────┘             │
│                                                     │
└─────────────────────────────────────────────────────┘

Setelah Submit (Success):
┌─────────────────────────────────────────────────────┐
│  ✅ PENDAFTARAN BERHASIL!                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Terima kasih telah mendaftar di Program:          │
│  🎓 Programming Club                                │
│                                                     │
│  Data Anda:                                         │
│  • Nama: Ahmad Rifki Pratama                        │
│  • Kelas: X                                         │
│  • Kejuruan: PPLG                                   │
│  • Email: ahmad.rifki@gmail.com                     │
│                                                     │
│  📧 Confermasi akan dikirim ke email Anda          │
│  ⏳ Tunggu pengumuman dari Admin                    │
│                                                     │
│  ┌─────────────────────────────────┐               │
│  │  Kembali ke Beranda              │               │
│  └─────────────────────────────────┘               │
│                                                     │
└─────────────────────────────────────────────────────┘

Error Message (Duplikat):
┌─────────────────────────────────────────────────────┐
│  ❌ PENDAFTARAN GAGAL                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Email: ahmad.rifki@gmail.com sudah terdaftar!     │
│  Setiap peserta hanya bisa mendaftar 1x             │
│                                                     │
│  Ingin menghubungi admin? Hubungi di:              │
│  📧 admin@osis.com                                  │
│  📱 +62-812-xxxx-xxxx                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 1.3 Halaman: Penerimaan Peserta Eskul

### **URL:** `/admin/eskul/acceptance` atau `/admin/dashboard/acceptance`

### **Akses:** Admin Eskul (Programming / English Club)

### **Fitur:**
```
┌────────────────────────────────────────────────────────────┐
│  PENERIMAAN PESERTA ESKUL                                  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Filter: [Programming ▼] [Menunggu ▼] [Search ...]       │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ No │ Nama       │ Kelas      │ Kejuruan      │ Email        │
├────┼────────────┼────────────┼───────────────┼──────────────┤
│ 1  │ Ahmad R.   │ X IPA 1    │ Software&Dev  │ ahmad.r@...  │
│    │ [✓ Terima] [✗ Tolak] [📧 Kirim Email]               │
├────┼────────────┼────────────┼───────────────┼──────────────┤
│ 2  │ Budi S.    │ X IPA 2    │ Multimedia    │ budi.s@...   │
│    │ [✓ Terima] [✗ Tolak] [📧 Kirim Email]               │
├────┼────────────┼────────────┼───────────────┼──────────────┤
│ 3  │ Citra D.   │ X IPS 1    │ Software&Dev  │ citra.d@...  │
│    │ [✓ Terima] [✗ Tolak] [📧 Kirim Email]               │
│                                                            │
│ Total Pending: 15 | Approved: 8 | Rejected: 2             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### **Action Button:**

#### **1. ✓ Terima (Accept)**
```
Proses:
1. Update DB: pendaftaran_eskul
   - status = "diterima"
   - accepted_at = NOW()
   - accepted_by = admin_id

2. Kirim Email ke Peserta:
   Subject: "Selamat! Anda Diterima di [Program Name]"
   
   Body Template:
   ──────────────────────────────────────────
   Assalamu'alaikum {nama},
   
   Selamat! 🎉
   Anda telah DITERIMA sebagai peserta 
   Ekstrakurikuler: {program}
   
   📋 Detail Peserta:
   • Nama: {nama}
   • Kelas: {kelas}
   • Kejuruan: {kejuruan}
   
   ⏰ Jadwal Pertemuan:
   Pertemuan pertama akan dimulai pada:
   Hari: {hari}
   Tanggal: {tanggal}
   Waktu: {waktu} - {waktu_selesai}
   Tempat: {lokasi}
   
   📍 Dengan Ketua Ekstrakurikuler:
   Nama: {ketua_name}
   Kontak: {ketua_phone}
   
   Terima kasih atas partisipasi Anda!
   Kami tunggu kehadiran Anda.
   
   Best regards,
   Admin {program}
   ──────────────────────────────────────────

3. Update UI:
   - Row berubah warna (hijau)
   - Status badge: "Diterima"
   - Button disable atau berubah
```

#### **2. ✗ Tolak (Reject)**
```
Proses:
1. Tampilkan Modal/Dialog:
   ┌─────────────────────────────────┐
   │ Alasan Penolakan (Optional):    │
   │ [________________]              │
   │                                 │
   │ [✓ Tolak] [Batal]              │
   └─────────────────────────────────┘

2. Update DB: pendaftaran_eskul
   - status = "ditolak"
   - rejected_at = NOW()
   - reject_reason = {alasan}
   - rejected_by = admin_id

3. Kirim Email ke Peserta:
   Subject: "Status Pendaftaran Anda"
   
   Body Template:
   ──────────────────────────────────────────
   Assalamu'alaikum {nama},
   
   Terima kasih telah mendaftar di 
   Ekstrakurikuler {program}.
   
   Dengan hormat, kami informasikan bahwa 
   pendaftaran Anda belum dapat kami terima 
   untuk kesempatan ini.
   
   Alasan: {reject_reason}
   
   Jangan putus semangat! Anda bisa mencoba 
   mendaftar kembali di kesempatan berikutnya.
   
   Jika ada pertanyaan, silakan hubungi:
   📧 admin@osis.com
   
   Terima kasih.
   ──────────────────────────────────────────

4. Update UI:
   - Row berubah warna (merah)
   - Status badge: "Ditolak"
```

#### **3. 📧 Kirim Email (Send Email)**
```
Proses:
1. Jika status = "diterima":
   - Kirim email penerimaan (seperti Terima button)
   
2. Jika status = "menunggu":
   - Tampilkan Modal untuk compose custom email
   ┌──────────────────────────────────────┐
   │ KIRIM EMAIL CUSTOM                   │
   ├──────────────────────────────────────┤
   │ To: {email_peserta}                  │
   │ Subject: [________________]           │
   │                                      │
   │ Body:                                │
   │ [_____________________________]       │
   │ [_____________________________]       │
   │                                      │
   │ [Kirim] [Batal]                     │
   └──────────────────────────────────────┘

3. Kirim via email service (SendGrid, Gmail API, etc)
```

---

## 1.4 Halaman: Daftar Siswa Eskul

### **URL:** `/admin/eskul/{program_id}/students`

### **Lokasi di UI:** 
Halaman detail Eskul, sebelah tombol "Tambah Siswa"

### **Tombol:** 
```
┌──────────────────────────────────────────────┐
│  🎓 EKSTRAKURIKULER: PROGRAMMING CLUB       │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐ │
│  │ [+ Tambah Siswa] [👥 Lihat Calon (5)] │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  Daftar Siswa Aktif (10):                    │
│  ┌──────────────────────────────────────┐   │
│  │ 1. Ahmad Rifki - X IPA 1             │   │
│  │ 2. Budi Santoso - X IPA 2            │   │
│  │ 3. Citra Dewi - X IPS 1              │   │
│  │ ...                                  │   │
│  └──────────────────────────────────────┘   │
│                                              │
└──────────────────────────────────────────────┘
```

### **Tampilan Modal Calon Peserta:**
```
┌──────────────────────────────────────────────────┐
│  👥 CALON PESERTA PROGRAMMING CLUB               │
├──────────────────────────────────────────────────┤
│                                                  │
│  Total Calon: 5 | Diterima: 3 | Ditolak: 1     │
│                                                  │
│  [Search...] [Filter: Semua ▼]                  │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ # │ Nama    │ Kelas    │ Email          │   │
│  ├──┼─────────┼──────────┼────────────────┤   │
│  │1 │ Ahmad R │ X IPA 1  │ ahmad.r@g...   │   │
│  │  │ Status: ✅ DITERIMA                  │   │
│  ├──┼─────────┼──────────┼────────────────┤   │
│  │2 │ Budi S  │ X IPA 2  │ budi.s@g...    │   │
│  │  │ Status: ⏳ MENUNGGU                  │   │
│  ├──┼─────────┼──────────┼────────────────┤   │
│  │3 │ Citra D │ X IPS 1  │ citra.d@g...   │   │
│  │  │ Status: ❌ DITOLAK                   │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  [Close]                                        │
└──────────────────────────────────────────────────┘
```

---

## 1.5 Database Schema: Eskul

```sql
-- Tabel Ekstrakurikuler
CREATE TABLE ekstrakurikuler (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama_ekstrakurikuler VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  deskripsi TEXT,
  ketua_ekstrakurikuler_id INT,
  hari_pertemuan VARCHAR(20), -- Senin, Selasa, dll
  waktu_mulai TIME,
  waktu_selesai TIME,
  lokasi VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ketua_ekstrakurikuler_id) REFERENCES users(id)
);

-- Tabel Pendaftaran Ekstrakurikuler
CREATE TABLE pendaftaran_eskul (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ekstrakurikuler_id INT NOT NULL,
  nama_peserta VARCHAR(100) NOT NULL,
  kelas VARCHAR(50) NOT NULL,
  kejuruan VARCHAR(100) NOT NULL,
  email_gmail VARCHAR(100) NOT NULL UNIQUE,
  nisn VARCHAR(20),
  status ENUM('menunggu', 'diterima', 'ditolak') DEFAULT 'menunggu',
  qr_token VARCHAR(255) UNIQUE,
  qr_token_expired_at DATETIME,
  accept_reason TEXT,
  reject_reason TEXT,
  accepted_by INT,
  accepted_at DATETIME,
  rejected_by INT,
  rejected_at DATETIME,
  email_sent_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ekstrakurikuler_id) REFERENCES ekstrakurikuler(id),
  FOREIGN KEY (accepted_by) REFERENCES users(id),
  FOREIGN KEY (rejected_by) REFERENCES users(id),
  INDEX idx_email_program (email_gmail, ekstrakurikuler_id),
  INDEX idx_status (status)
);

-- Tabel Email Log (untuk tracking email terkirim)
CREATE TABLE email_log_eskul (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pendaftaran_id INT NOT NULL,
  recipient_email VARCHAR(100) NOT NULL,
  email_type ENUM('confirmation', 'acceptance', 'rejection') NOT NULL,
  subject VARCHAR(255),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('sent', 'failed', 'bounced') DEFAULT 'sent',
  error_message TEXT,
  FOREIGN KEY (pendaftaran_id) REFERENCES pendaftaran_eskul(id)
);

-- Sample Data
INSERT INTO ekstrakurikuler VALUES
(1, 'Programming Club', 'programming-club', 'Belajar coding dan game development', 
 2, 'Jumat', '14:00:00', '16:00:00', 'Lab Komputer 1', NOW(), NOW()),
(2, 'English Club', 'english-club', 'Meningkatkan kemampuan Bahasa Inggris', 
 3, 'Rabu', '15:30:00', '17:00:00', 'Ruang Kelas 5', NOW(), NOW());

INSERT INTO pendaftaran_eskul VALUES
(1, 1, 'Ahmad Rifki Pratama', 'X', 'PPLG', 'ahmad.rifki@gmail.com', 
 '12345678901', 'diterima', 'token_abc123', DATE_ADD(NOW(), INTERVAL 24 HOUR),
 NULL, NULL, 1, NOW(), NULL, NULL, NOW(), NOW(), NOW()),
(2, 1, 'Budi Santoso', 'X', 'DKV', 'budi.santoso@gmail.com', 
 '12345678902', 'menunggu', 'token_def456', DATE_ADD(NOW(), INTERVAL 24 HOUR),
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(3, 2, 'Citra Dewi', 'XI', 'PPLG', 'citra.dewi@gmail.com', 
 '12345678903', 'diterima', 'token_ghi789', DATE_ADD(NOW(), INTERVAL 24 HOUR),
 NULL, NULL, 2, NOW(), NULL, NULL, NOW(), NOW(), NOW()),
(4, 1, 'Desy Oktavia', 'X', 'TJKT', 'desy.oktavia@gmail.com',
 '12345678904', 'menunggu', 'token_jkl012', DATE_ADD(NOW(), INTERVAL 24 HOUR),
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(5, 2, 'Eka Putra Wijaya', 'XI', 'AKC 1', 'eka.putra@gmail.com',
 '12345678905', 'diterima', 'token_mno345', DATE_ADD(NOW(), INTERVAL 24 HOUR),
 NULL, NULL, 2, NOW(), NULL, NULL, NOW(), NOW(), NOW()),
(6, 1, 'Fathan Aziz Rahman', 'X', 'AKL', 'fathan.aziz@gmail.com',
 '12345678906', 'menunggu', 'token_pqr678', DATE_ADD(NOW(), INTERVAL 24 HOUR),
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(7, 2, 'Gita Melani Sari', 'XI', 'TLM', 'gita.melani@gmail.com',
 '12345678907', 'ditolak', 'token_stu901', DATE_ADD(NOW(), INTERVAL 24 HOUR),
 NULL, 'Sudah memiliki kesibukan ekstrakurikuler lain', 3, NOW(), NOW(), NOW(), NOW(), NOW()),
(8, 1, 'Hendra Wijaya', 'X', 'MPLB 1', 'hendra.wijaya@gmail.com',
 '12345678908', 'diterima', 'token_vwx234', DATE_ADD(NOW(), INTERVAL 24 HOUR),
 NULL, NULL, 1, NOW(), NULL, NULL, NOW(), NOW(), NOW());
```

---

# 🏛️ BAGIAN 2: PENDAFTARAN OSIS/MPK

## 2.1 Flow Pendaftaran OSIS/MPK

```
┌─────────────────────────────────────────────────────┐
│  Peserta Scan QR Code Pendaftaran OSIS/MPK         │
└────────────────┬────────────────────────────────────┘
                 ↓
         ┌───────────────┐
         │ Cek QR Code   │
         │ Validasi      │
         └───────┬───────┘
                 ↓
    ┌────────────────────────────┐
    │ Halaman Form Pendaftaran   │
    │ - Nama                     │
    │ - Kelas                    │
    │ - Kejuruan                 │
    │ - Email Gmail              │
    │ - Submit Button            │
    └────────────┬───────────────┘
                 ↓
    ┌────────────────────────────────┐
    │ Cek Data Duplikat:             │
    │ - Email sudah terdaftar?       │
    │ - NISN sudah terdaftar?        │
    └────────────┬───────────────────┘
                 ↓ (Valid)
    ┌────────────────────────────────────┐
    │ Simpan ke DB: pendaftaran_osis_mpk │
    │ Status: "Calon"                    │
    └────────────┬───────────────────────┘
                 ↓
    ┌────────────────────────────────────┐
    │ Tampil Pesan: "Pendaftaran Berhasil│
    │ Tunggu Pengumuman Penerimaan"      │
    └────────────────────────────────────┘
```

---

## 2.2 Halaman: Form Pendaftaran OSIS/MPK

### **URL:** `/osis-mpk/register` atau `/organisasi/register`

### **QR Code Configuration:**
```
QR Code Content (JSON):
{
  "type": "osis_mpk_registration",
  "organization": "osis", // atau "mpk"
  "registration_url": "https://domain.com/osis-mpk/register?org=osis&qr_token=xyz789"
}

QR Code Text (Alternative):
https://domain.com/osis-mpk/register?org=osis&qr_token=token_unik_456
```

### **Form Fields:**

| Field | Type | Validasi | Contoh |
|-------|------|----------|---------|
| Nama Lengkap | Text Input | Required, max 100 char | Ahmad Rifki Pratama |
| Kelas | Dropdown | Required | X, XI |
| Kejuruan | Dropdown | Required | DKV, PPLG, MPLB 1, MPLB 2, AKL, TJKT, AKC 1, AKC 2, AKC 3, AKC 4, AKC 5, AKC 6, TLM, FARMASI |
| Email Gmail | Email | Required, unique, must be @gmail.com | ahmad.rifki@gmail.com |
| Organisasi | Hidden/Display | Auto-filled dari QR | OSIS / MPK |

### **Kelas Options:**
```
- X (Kelas 10)
- XI (Kelas 11)
```

### **Kejuruan Options:**

#### **Skill Skarla (SKARLA):**
- DKV (Desain Komunikasi Visual)
- PPLG (Pengembangan Perangkat Lunak dan Gim)
- MPLB 1 (Multimedia Produksi Lanjutan Broadcast 1)
- MPLB 2 (Multimedia Produksi Lanjutan Broadcast 2)
- AKL (Akuntansi dan Keuangan Lanjutan)
- TJKT (Teknik Jaringan Komputer dan Telekomunikasi)

#### **Skill Skakes (SKAKES):**
- AKC 1 (Akomodasi Perhotelan 1)
- AKC 2 (Akomodasi Perhotelan 2)
- AKC 3 (Akomodasi Perhotelan 3)
- AKC 4 (Akomodasi Perhotelan 4)
- AKC 5 (Akomodasi Perhotelan 5)
- AKC 6 (Akomodasi Perhotelan 6)
- TLM (Tata Laksana Makanan)
- FARMASI (Farmasi)

### **Form Validation:**
```javascript
// Backend Validation:
1. Nama: tidak boleh kosong, min 5 char, max 100 char
2. Kelas: harus dipilih dari dropdown
3. Kejuruan: harus dipilih dari dropdown
4. Email: 
   - Format valid (@gmail.com required)
   - Belum terdaftar sebagai calon di organisasi yang sama
   - Belum diterima di organisasi yang sama
5. QR Token: valid dan belum expired

// Cegah Duplikat:
SELECT COUNT(*) FROM pendaftaran_osis_mpk 
WHERE email = ? AND organisasi = ? AND status IN ('calon', 'diterima')
// Jika count > 0: tampil error "Email sudah terdaftar"
```

### **UI/UX Halaman:**
```
┌─────────────────────────────────────────────────────┐
│  📝 FORM PENDAFTARAN ORGANISASI                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Organisasi: [OSIS ▼] (read-only)                  │
│                                                     │
│  Nama Lengkap: [________________]                   │
│  *Required, max 100 char                            │
│                                                     │
│  Kelas: [X ▼]                                      │
│  *Required (X atau XI)                             │
│                                                     │
│  Kejuruan: [PPLG ▼]                                │
│  *Required                                          │
│  SKARLA: DKV, PPLG, MPLB 1, MPLB 2, AKL, TJKT     │
│  SKAKES: AKC 1-6, TLM, FARMASI                     │
│                                                     │
│  Email Gmail: [________________@gmail.com]          │
│  *Required, harus @gmail.com, belum terdaftar       │
│                                                     │
│  ┌───────────────────────────────────┐             │
│  │  ✓ Daftar   │   ✗ Batal           │             │
│  └───────────────────────────────────┘             │
│                                                     │
└─────────────────────────────────────────────────────┘

Setelah Submit (Success):
┌─────────────────────────────────────────────────────┐
│  ✅ PENDAFTARAN BERHASIL!                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Terima kasih telah mendaftar sebagai calon        │
│  Organisasi: 🏛️ OSIS                               │
│                                                     │
│  Data Anda:                                         │
│  • Nama: Ahmad Rifki Pratama                        │
│  • Kelas: X                                         │
│  • Kejuruan: PPLG                                   │
│  • Email: ahmad.rifki@gmail.com                     │
│                                                     │
│  📧 Pengumuman penerimaan akan dikirim ke email     │
│  ⏳ Tunggu pengumuman dari Panitia Seleksi          │
│                                                     │
│  ┌─────────────────────────────────┐               │
│  │  Kembali ke Beranda              │               │
│  └─────────────────────────────────┘               │
│                                                     │
└─────────────────────────────────────────────────────┘

Error Message (Duplikat):
┌─────────────────────────────────────────────────────┐
│  ❌ PENDAFTARAN GAGAL                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Email: ahmad.rifki@gmail.com sudah terdaftar!     │
│  Setiap peserta hanya bisa mendaftar 1x             │
│                                                     │
│  Ingin menghubungi panitia seleksi?                │
│  📧 panitia@osis.com                               │
│  📱 +62-812-xxxx-xxxx                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 2.3 Halaman: Penerimaan Calon OSIS/MPK

### **URL:** `/admin/osis-mpk/acceptance` atau `/admin/organisasi/acceptance`

### **Akses:** Admin OSIS / Admin MPK

### **Fitur:**
```
┌────────────────────────────────────────────────────────────┐
│  PENERIMAAN CALON ORGANISASI                               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Filter: [OSIS ▼] [Calon ▼] [Search ...]                 │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ No │ Nama       │ Kelas      │ Kejuruan      │ Email        │
├────┼────────────┼────────────┼───────────────┼──────────────┤
│ 1  │ Ahmad R.   │ X IPA 1    │ Software&Dev  │ ahmad.r@...  │
│    │ [✓ Terima] [✗ Tolak] [📧 Kirim Email]               │
├────┼────────────┼────────────┼───────────────┼──────────────┤
│ 2  │ Budi S.    │ X IPA 2    │ Multimedia    │ budi.s@...   │
│    │ [✓ Terima] [✗ Tolak] [📧 Kirim Email]               │
├────┼────────────┼────────────┼───────────────┼──────────────┤
│ 3  │ Citra D.   │ X IPS 1    │ Software&Dev  │ citra.d@...  │
│    │ [✓ Terima] [✗ Tolak] [📧 Kirim Email]               │
│                                                            │
│ Total Calon: 25 | Diterima: 12 | Ditolak: 8              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### **Action Button:**

#### **1. ✓ Terima (Accept)**
```
Proses:
1. Update DB: pendaftaran_osis_mpk
   - status = "diterima"
   - accepted_at = NOW()
   - accepted_by = admin_id

2. Kirim Email ke Calon:
   Subject: "Selamat! Anda Diterima di OSIS"
   
   Body Template:
   ──────────────────────────────────────────
   Assalamu'alaikum {nama},
   
   Selamat! 🎉
   Anda telah DITERIMA sebagai anggota
   Organisasi: {organisasi_name}
   
   📋 Detail Calon:
   • Nama: {nama}
   • Kelas: {kelas}
   • Kejuruan: {kejuruan}
   
   ⏰ Kegiatan Organisasi:
   Rapat pertama akan diadakan pada:
   Hari: {hari}
   Tanggal: {tanggal}
   Waktu: {waktu} - {waktu_selesai}
   Tempat: {lokasi}
   
   📍 Koordinator:
   Nama: {koordinator_name}
   Kontak: {koordinator_phone}
   
   Terima kasih atas dedikasi Anda untuk 
   berkontribusi di organisasi kami!
   
   Best regards,
   Panitia Seleksi {organisasi_name}
   ──────────────────────────────────────────

3. Update UI:
   - Row berubah warna (hijau)
   - Status badge: "Diterima"
   - Button disable atau berubah
```

#### **2. ✗ Tolak (Reject)**
```
Proses:
1. Tampilkan Modal/Dialog:
   ┌─────────────────────────────────┐
   │ Alasan Penolakan (Optional):    │
   │ [________________]              │
   │                                 │
   │ [✓ Tolak] [Batal]              │
   └─────────────────────────────────┘

2. Update DB: pendaftaran_osis_mpk
   - status = "ditolak"
   - rejected_at = NOW()
   - reject_reason = {alasan}
   - rejected_by = admin_id

3. Kirim Email ke Calon:
   Subject: "Status Pendaftaran Organisasi Anda"
   
   Body Template:
   ──────────────────────────────────────────
   Assalamu'alaikum {nama},
   
   Terima kasih telah mendaftar sebagai calon
   Organisasi {organisasi_name}.
   
   Dengan hormat, kami informasikan bahwa 
   pendaftaran Anda belum dapat kami terima 
   untuk kesempatan ini.
   
   Alasan: {reject_reason}
   
   Jangan putus semangat! Anda bisa mencoba 
   mendaftar kembali di pembukaan seleksi 
   berikutnya.
   
   Jika ada pertanyaan, silakan hubungi:
   📧 panitia@osis.com
   
   Terima kasih.
   ──────────────────────────────────────────

4. Update UI:
   - Row berubah warna (merah)
   - Status badge: "Ditolak"
```

#### **3. 📧 Kirim Email (Send Email)**
```
Proses sama dengan Eskul - custom email compose
```

---

## 2.4 Halaman: Daftar Calon OSIS/MPK di Halaman Organisasi

### **URL:** `/admin/osis/{organisasi_id}/candidates` 

### **Lokasi di UI:** 
Halaman detail organisasi OSIS/MPK

### **Button:**
```
┌──────────────────────────────────────────────────┐
│  🏛️ ORGANISASI: OSIS                             │
├──────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────┐ │
│  │ [Calon OSIS (15)] [Anggota Aktif (20)]     │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  Tab: [Calon OSIS] [Anggota Aktif] [Ditolak]   │
│                                                  │
│  Tab Content - Calon OSIS (15):                 │
│  ┌──────────────────────────────────────────┐   │
│  │ 1. Ahmad Rifki - X IPA 1 - Menunggu      │   │
│  │ 2. Budi Santoso - X IPA 2 - Menunggu     │   │
│  │ 3. Citra Dewi - X IPS 1 - Diterima ✅    │   │
│  │ ...                                      │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  Tab Content - Anggota Aktif (20):              │
│  ┌──────────────────────────────────────────┐   │
│  │ 1. Ahmad Rifki - X IPA 1                 │   │
│  │ 2. Citra Dewi - X IPS 1                  │   │
│  │ 3. Desy Oktavia - X IPS 2                │   │
│  │ ...                                      │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
└──────────────────────────────────────────────────┘
```

### **Tampilan Modal/Tab Calon:**
```
┌──────────────────────────────────────────────────┐
│  📋 CALON ORGANISASI OSIS                        │
├──────────────────────────────────────────────────┤
│                                                  │
│  Total Calon: 15 | Diterima: 5 | Ditolak: 2   │
│  [Search...] [Filter: Semua ▼] [Export]        │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ # │ Nama    │ Kelas    │ Status   │ Email │   │
│  ├──┼─────────┼──────────┼──────────┼──────┤   │
│  │1 │ Ahmad R │ X IPA 1  │ ✅ TERIMA │ahmad │   │
│  │2 │ Budi S  │ X IPA 2  │ ⏳ CALON  │budi  │   │
│  │3 │ Citra D │ X IPS 1  │ ✅ TERIMA │citra │   │
│  │4 │ Desy O  │ X IPS 2  │ ⏳ CALON  │desy  │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  [Close]                                        │
└──────────────────────────────────────────────────┘
```

---

## 2.5 Database Schema: OSIS/MPK

```sql
-- Tabel Organisasi (OSIS/MPK)
CREATE TABLE organisasi (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama_organisasi VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  tipe ENUM('osis', 'mpk') NOT NULL,
  ketua_organisasi_id INT,
  deskripsi TEXT,
  lokasi_rapat VARCHAR(100),
  hari_rapat VARCHAR(20),
  waktu_mulai TIME,
  waktu_selesai TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ketua_organisasi_id) REFERENCES users(id)
);

-- Tabel Pendaftaran OSIS/MPK
CREATE TABLE pendaftaran_osis_mpk (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organisasi_id INT NOT NULL,
  nama_peserta VARCHAR(100) NOT NULL,
  kelas VARCHAR(50) NOT NULL,
  kejuruan VARCHAR(100) NOT NULL,
  email_gmail VARCHAR(100) NOT NULL,
  nisn VARCHAR(20),
  status ENUM('calon', 'diterima', 'ditolak') DEFAULT 'calon',
  qr_token VARCHAR(255) UNIQUE,
  qr_token_expired_at DATETIME,
  accept_reason TEXT,
  reject_reason TEXT,
  accepted_by INT,
  accepted_at DATETIME,
  rejected_by INT,
  rejected_at DATETIME,
  email_sent_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organisasi_id) REFERENCES organisasi(id),
  FOREIGN KEY (accepted_by) REFERENCES users(id),
  FOREIGN KEY (rejected_by) REFERENCES users(id),
  INDEX idx_email_org (email_gmail, organisasi_id),
  INDEX idx_status (status),
  UNIQUE KEY unique_email_org (email_gmail, organisasi_id)
);

-- Tabel Email Log OSIS/MPK
CREATE TABLE email_log_osis_mpk (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pendaftaran_id INT NOT NULL,
  recipient_email VARCHAR(100) NOT NULL,
  email_type ENUM('confirmation', 'acceptance', 'rejection') NOT NULL,
  subject VARCHAR(255),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('sent', 'failed', 'bounced') DEFAULT 'sent',
  error_message TEXT,
  FOREIGN KEY (pendaftaran_id) REFERENCES pendaftaran_osis_mpk(id)
);

-- Sample Data
INSERT INTO organisasi VALUES
(1, 'OSIS', 'osis', 'osis', 1, 'Organisasi Siswa Intra Sekolah', 'Ruang OSIS', 'Jumat', '14:00:00', '16:00:00', NOW(), NOW()),
(2, 'MPK', 'mpk', 'mpk', 2, 'Majelis Perwakilan Kelas', 'Ruang MPK', 'Kamis', '15:00:00', '17:00:00', NOW(), NOW());

INSERT INTO pendaftaran_osis_mpk VALUES
(1, 1, 'Ahmad Rifki Pratama', 'X', 'PPLG', 'ahmad.rifki@gmail.com', 
 '12345678901', 'diterima', 'token_org001', DATE_ADD(NOW(), INTERVAL 24 HOUR),
 NULL, NULL, 1, NOW(), NULL, NULL, NOW(), NOW(), NOW()),
(2, 1, 'Budi Santoso', 'X', 'DKV', 'budi.santoso@gmail.com', 
 '12345678902', 'calon', 'token_org002', DATE_ADD(NOW(), INTERVAL 24 HOUR),
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(3, 2, 'Citra Dewi', 'XI', 'PPLG', 'citra.dewi@gmail.com', 
 '12345678903', 'diterima', 'token_org003', DATE_ADD(NOW(), INTERVAL 24 HOUR),
 NULL, NULL, 2, NOW(), NULL, NULL, NOW(), NOW(), NOW()),
(4, 1, 'Desy Oktavia', 'X', 'TJKT', 'desy.oktavia@gmail.com',
 '12345678904', 'calon', 'token_org004', DATE_ADD(NOW(), INTERVAL 24 HOUR),
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(5, 2, 'Eka Putra Wijaya', 'XI', 'AKC 1', 'eka.putra@gmail.com',
 '12345678905', 'diterima', 'token_org005', DATE_ADD(NOW(), INTERVAL 24 HOUR),
 NULL, NULL, 2, NOW(), NULL, NULL, NOW(), NOW(), NOW()),
(6, 1, 'Fathan Aziz Rahman', 'X', 'AKL', 'fathan.aziz@gmail.com',
 '12345678906', 'calon', 'token_org006', DATE_ADD(NOW(), INTERVAL 24 HOUR),
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(7, 2, 'Gita Melani Sari', 'XI', 'TLM', 'gita.melani@gmail.com',
 '12345678907', 'ditolak', 'token_org007', DATE_ADD(NOW(), INTERVAL 24 HOUR),
 NULL, 'Tidak memenuhi kriteria nilai akademik', 1, NOW(), NOW(), NOW(), NOW(), NOW()),
(8, 1, 'Hendra Wijaya', 'X', 'MPLB 1', 'hendra.wijaya@gmail.com',
 '12345678908', 'diterima', 'token_org008', DATE_ADD(NOW(), INTERVAL 24 HOUR),
 NULL, NULL, 1, NOW(), NULL, NULL, NOW(), NOW(), NOW()),
(9, 2, 'Indah Permata', 'XI', 'FARMASI', 'indah.permata@gmail.com',
 '12345678909', 'calon', 'token_org009', DATE_ADD(NOW(), INTERVAL 24 HOUR),
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(10, 1, 'Joko Prasetyo', 'X', 'MPLB 2', 'joko.prasetyo@gmail.com',
 '12345678910', 'diterima', 'token_org010', DATE_ADD(NOW(), INTERVAL 24 HOUR),
 NULL, NULL, 1, NOW(), NULL, NULL, NOW(), NOW(), NOW());
```

---

# 🛡️ KEAMANAN & PENCEGAHAN DUPLIKAT

## 3.1 Strategi Pencegahan Duplikat

### **Level 1: Database Constraint**
```sql
-- Unique constraint pada email + program/organisasi
ALTER TABLE pendaftaran_eskul 
ADD UNIQUE KEY unique_email_program (email_gmail, ekstrakurikuler_id);

ALTER TABLE pendaftaran_osis_mpk 
ADD UNIQUE KEY unique_email_org (email_gmail, organisasi_id);
```

### **Level 2: Query Before Insert**
```javascript
// Backend check sebelum insert
async function checkDuplicate(email, programId, type) {
  let query, params;
  
  if (type === 'eskul') {
    query = `SELECT COUNT(*) as count FROM pendaftaran_eskul 
             WHERE email_gmail = ? AND ekstrakurikuler_id = ? 
             AND status IN ('menunggu', 'diterima')`;
    params = [email, programId];
  } else if (type === 'osis_mpk') {
    query = `SELECT COUNT(*) as count FROM pendaftaran_osis_mpk 
             WHERE email_gmail = ? AND organisasi_id = ? 
             AND status IN ('calon', 'diterima')`;
    params = [email, programId];
  }
  
  const result = await db.query(query, params);
  return result[0].count > 0;
}

// Gunakan saat submit form
if (await checkDuplicate(email, programId, 'eskul')) {
  return res.status(409).json({
    success: false,
    message: 'Email sudah terdaftar di program ini'
  });
}
```

### **Level 3: Frontend Validation**
```javascript
// Realtime check dengan debounce
async function validateEmail(email, programId) {
  const response = await fetch(
    `/api/check-email?email=${email}&program=${programId}`
  );
  const data = await response.json();
  
  if (!data.available) {
    setEmailError('Email sudah terdaftar');
  }
}
```

### **Level 4: QR Token Validation**
```sql
-- QR Token harus unique dan valid
SELECT * FROM pendaftaran_eskul 
WHERE qr_token = ? 
AND qr_token_expired_at > NOW()
AND status = 'menunggu'

-- Jika tidak ada row: token invalid/expired
```

---

## 3.2 Error Messages & Responses

### **Email Sudah Terdaftar (Program yang Sama)**
```json
{
  "success": false,
  "code": "DUPLICATE_EMAIL",
  "message": "Email ahmad.rifki@gmail.com sudah terdaftar di Programming Club",
  "action": "hubungi admin"
}
```

### **Email Sudah Diterima**
```json
{
  "success": false,
  "code": "ALREADY_ACCEPTED",
  "message": "Email ahmad.rifki@gmail.com sudah diterima di Programming Club",
  "action": "login ke dashboard"
}
```

### **QR Token Invalid/Expired**
```json
{
  "success": false,
  "code": "INVALID_QR_TOKEN",
  "message": "QR Code tidak valid atau sudah expired",
  "action": "minta QR code baru dari admin"
}
```

---

# 📧 EMAIL TEMPLATE CONFIGURATION

## 4.1 Email Service Setup

**Service:** SendGrid, Gmail API, atau Mailgun

```javascript
// Config contoh dengan SendGrid
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Template IDs (di SendGrid)
const TEMPLATES = {
  ESKUL_ACCEPTANCE: 'd-abc123def456',
  ESKUL_REJECTION: 'd-xyz789uvw012',
  OSIS_ACCEPTANCE: 'd-pqr345stu678',
  OSIS_REJECTION: 'd-lmn901opq234'
};
```

## 4.2 Email Template Variables

```
ESKUL ACCEPTANCE:
- {nama}
- {program} (Programming Club / English Club)
- {kelas}
- {kejuruan}
- {hari} (Jumat)
- {tanggal} (05 Juni 2026)
- {waktu} (14:00)
- {waktu_selesai} (16:00)
- {lokasi}
- {ketua_name}
- {ketua_phone}

OSIS/MPK ACCEPTANCE:
- {nama}
- {organisasi} (OSIS / MPK)
- {kelas}
- {kejuruan}
- {hari}
- {tanggal}
- {waktu}
- {waktu_selesai}
- {lokasi_rapat}
- {koordinator_name}
- {koordinator_phone}

REJECTION:
- {nama}
- {program/organisasi}
- {reject_reason} (optional)
```

---

# 🔌 API ENDPOINTS

## 5.1 Eskul Endpoints

```
POST   /api/eskul/register
GET    /api/check-email?email=&program=
GET    /api/ekstrakurikuler
GET    /api/ekstrakurikuler/:id/candidates
PATCH  /api/pendaftaran-eskul/:id/accept
PATCH  /api/pendaftaran-eskul/:id/reject
POST   /api/pendaftaran-eskul/:id/send-email

```

## 5.2 OSIS/MPK Endpoints

```
POST   /api/osis-mpk/register
GET    /api/check-email?email=&org=
GET    /api/organisasi
GET    /api/organisasi/:id/candidates
PATCH  /api/pendaftaran-osis-mpk/:id/accept
PATCH  /api/pendaftaran-osis-mpk/:id/reject
POST   /api/pendaftaran-osis-mpk/:id/send-email
```

---

# 📱 UI/UX Navigation Structure

```
HALAMAN UTAMA
│
├─ Pendaftaran
│  ├─ Eskul (Form dengan QR)
│  │  └─ Hasil (Sukses/Gagal)
│  └─ OSIS/MPK (Form dengan QR)
│     └─ Hasil (Sukses/Gagal)
│
├─ Dashboard Admin
│  ├─ Ekstrakurikuler
│  │  ├─ Management
│  │  ├─ Penerimaan Peserta
│  │  ├─ List Calon Peserta
│  │  └─ List Anggota Aktif
│  │
│  └─ Organisasi
│     ├─ OSIS
│     │  ├─ Management
│     │  ├─ Penerimaan Calon
│     │  ├─ List Calon
│     │  └─ List Anggota
│     │
│     └─ MPK
│        ├─ Management
│        ├─ Penerimaan Calon
│        ├─ List Calon
│        └─ List Anggota
│
└─ Laporan
   ├─ Total Pendaftar
   ├─ Diterima vs Ditolak
   └─ Export Data
```

---

# 📊 REFERENSI DATA: KELAS & KEJURUAN

## Kelas Options

| No | Kelas | Singkat | Tingkat |
|-----|-------|---------|---------|
| 1 | X | X | Kelas 10 / Pertama |
| 2 | XI | XI | Kelas 11 / Kedua |

---

## Kejuruan Options

### **Skill Skarla (SKARLA) - 6 Program**

| No | Kode | Nama Lengkap | Singkat |
|-----|------|--------------|---------|
| 1 | DKV | Desain Komunikasi Visual | DKV |
| 2 | PPLG | Pengembangan Perangkat Lunak dan Gim | PPLG |
| 3 | MPLB 1 | Multimedia Produksi Lanjutan Broadcast 1 | MPLB 1 |
| 4 | MPLB 2 | Multimedia Produksi Lanjutan Broadcast 2 | MPLB 2 |
| 5 | AKL | Akuntansi dan Keuangan Lanjutan | AKL |
| 6 | TJKT | Teknik Jaringan Komputer dan Telekomunikasi | TJKT |

### **Skill Skakes (SKAKES) - 8 Program**

| No | Kode | Nama Lengkap | Singkat |
|-----|------|--------------|---------|
| 1 | AKC 1 | Akomodasi Perhotelan 1 | AKC 1 |
| 2 | AKC 2 | Akomodasi Perhotelan 2 | AKC 2 |
| 3 | AKC 3 | Akomodasi Perhotelan 3 | AKC 3 |
| 4 | AKC 4 | Akomodasi Perhotelan 4 | AKC 4 |
| 5 | AKC 5 | Akomodasi Perhotelan 5 | AKC 5 |
| 6 | AKC 6 | Akomodasi Perhotelan 6 | AKC 6 |
| 7 | TLM | Tata Laksana Makanan | TLM |
| 8 | FARMASI | Farmasi | FARMASI |

---

### **Tabel Dropdown Database (untuk reference)**

```sql
-- Tabel Master Kelas
CREATE TABLE master_kelas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  kelas_nama VARCHAR(10) NOT NULL UNIQUE,
  kelas_singkat VARCHAR(5) NOT NULL,
  tingkat VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO master_kelas VALUES
(1, 'X', 'X', 'Kelas 10', NOW()),
(2, 'XI', 'XI', 'Kelas 11', NOW());

-- Tabel Master Kejuruan
CREATE TABLE master_kejuruan (
  id INT PRIMARY KEY AUTO_INCREMENT,
  kejuruan_kode VARCHAR(20) NOT NULL UNIQUE,
  kejuruan_nama VARCHAR(100) NOT NULL,
  kejuruan_singkat VARCHAR(20) NOT NULL,
  skill_group ENUM('SKARLA', 'SKAKES') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO master_kejuruan VALUES
(1, 'DKV', 'Desain Komunikasi Visual', 'DKV', 'SKARLA', NOW()),
(2, 'PPLG', 'Pengembangan Perangkat Lunak dan Gim', 'PPLG', 'SKARLA', NOW()),
(3, 'MPLB 1', 'Multimedia Produksi Lanjutan Broadcast 1', 'MPLB 1', 'SKARLA', NOW()),
(4, 'MPLB 2', 'Multimedia Produksi Lanjutan Broadcast 2', 'MPLB 2', 'SKARLA', NOW()),
(5, 'AKL', 'Akuntansi dan Keuangan Lanjutan', 'AKL', 'SKARLA', NOW()),
(6, 'TJKT', 'Teknik Jaringan Komputer dan Telekomunikasi', 'TJKT', 'SKARLA', NOW()),
(7, 'AKC 1', 'Akomodasi Perhotelan 1', 'AKC 1', 'SKAKES', NOW()),
(8, 'AKC 2', 'Akomodasi Perhotelan 2', 'AKC 2', 'SKAKES', NOW()),
(9, 'AKC 3', 'Akomodasi Perhotelan 3', 'AKC 3', 'SKAKES', NOW()),
(10, 'AKC 4', 'Akomodasi Perhotelan 4', 'AKC 4', 'SKAKES', NOW()),
(11, 'AKC 5', 'Akomodasi Perhotelan 5', 'AKC 5', 'SKAKES', NOW()),
(12, 'AKC 6', 'Akomodasi Perhotelan 6', 'AKC 6', 'SKAKES', NOW()),
(13, 'TLM', 'Tata Laksana Makanan', 'TLM', 'SKAKES', NOW()),
(14, 'FARMASI', 'Farmasi', 'FARMASI', 'SKAKES', NOW());
```

### **API Query untuk Dropdown (Backend)**

```javascript
// Get Kelas List
GET /api/master/kelas
Response:
[
  { id: 1, kelas_nama: "X", kelas_singkat: "X" },
  { id: 2, kelas_nama: "XI", kelas_singkat: "XI" }
]

// Get Kejuruan List
GET /api/master/kejuruan
Response:
[
  { id: 1, kejuruan_kode: "DKV", kejuruan_nama: "Desain Komunikasi Visual", skill_group: "SKARLA" },
  { id: 2, kejuruan_kode: "PPLG", kejuruan_nama: "Pengembangan Perangkat Lunak dan Gim", skill_group: "SKARLA" },
  ...
]

// Get Kejuruan by Skill Group
GET /api/master/kejuruan?skill_group=SKARLA
Response:
[
  { id: 1, kejuruan_kode: "DKV", ... },
  { id: 2, kejuruan_kode: "PPLG", ... },
  ...
]
```

---

# ✅ CHECKLIST IMPLEMENTASI

## Backend
- [ ] Create database tables (ekstrakurikuler, pendaftaran_eskul, organisasi, pendaftaran_osis_mpk)
- [ ] Setup email service (SendGrid/Gmail API)
- [ ] Create API endpoints (register, accept, reject, send-email)
- [ ] Implement duplicate checking logic
- [ ] Implement QR token generation & validation
- [ ] Add email logging tables
- [ ] Create scheduled jobs untuk cleanup expired tokens

## Frontend
- [ ] Create registration form pages (Eskul & OSIS/MPK)
- [ ] Create success/error pages after submission
- [ ] Create admin acceptance dashboard (Eskul & OSIS/MPK)
- [ ] Create candidates list modals/tabs
- [ ] Implement QR code scanner integration
- [ ] Add form validation (client-side)
- [ ] Implement duplicate email check (realtime)
- [ ] Add status badges & color coding

## Testing
- [ ] Test registration dengan valid data
- [ ] Test duplicate email prevention
- [ ] Test invalid QR token
- [ ] Test email sending (acceptance & rejection)
- [ ] Test acceptance/rejection flow
- [ ] Test candidates list display
- [ ] Manual testing dengan real users

## Deployment
- [ ] Configure environment variables
- [ ] Setup email service credentials
- [ ] Test production email sending
- [ ] Create QR codes untuk production
- [ ] Monitor email delivery & bounces
- [ ] Backup database regularly

---

**Selesai ✅** Dokumentasi fitur pendaftaran eskul dan OSIS/MPK siap untuk development!
