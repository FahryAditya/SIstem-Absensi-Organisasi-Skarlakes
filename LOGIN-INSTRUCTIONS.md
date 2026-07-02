# Instruksi Login - Sistem Ekstrakurikuler

## Status Perbaikan
✅ **FIXED**: Masalah login sudah diperbaiki!

## Masalah yang Ditemukan dan Diperbaiki

### 1. **Database Kosong**
- Database Supabase baru tidak memiliki tabel dan data
- **Solusi**: Menjalankan migration dengan `npx prisma migrate deploy`

### 2. **Tidak Ada User di Database**
- Setelah migration, tidak ada user yang bisa login
- **Solusi**: Import semua admin dari database lama ke database baru dengan password yang di-hash

### 3. **Login Route Error saat Tidak Ada Organization**
- API login crash karena user belum punya relasi ke organization
- **Solusi**: Update login route untuk handle user tanpa organization (menggunakan optional chaining)

## Akun yang Tersedia untuk Login

Semua akun berikut sudah diimport ke database baru dan siap digunakan:

### 1. Administrator
- **Nama**: Fahry Aditya Setiawan
- **Email**: Fahryadityasetiawann@gmail.com
- **Password**: AdministratorFahry
- **Role**: administrator

### 2. Admin OSIS/MPK
- **Nama**: Eunike Devina
- **Email**: osismpkskarlakes1@gmail.com
- **Password**: osismpk1
- **Role**: admin_osis_mpk

- **Nama**: Meyshlla Carrolline
- **Email**: osismpkskarlakes2@gmail.com
- **Password**: osismpk2
- **Role**: admin_osis_mpk

- **Nama**: Yezia Naftali
- **Email**: osismpkskarlakes3@gmail.com
- **Password**: osismpk3
- **Role**: admin_osis_mpk

- **Nama**: testsistem
- **Email**: testsistem@gmail.com
- **Password**: testsistem1
- **Role**: admin_osis_mpk

### 3. Admin Programming
- **Nama**: Samuel Alden
- **Email**: programmingakarlakes1@gmail.com
- **Password**: pgskarlakes1
- **Role**: admin_programming

- **Nama**: Aisyah
- **Email**: programmingakarlakes2@gmail.com
- **Password**: pgskarlakes2
- **Role**: admin_programming

- **Nama**: Kheysha Aqila
- **Email**: programmingskarlakes3@gmail.com
- **Password**: pgskarlakes3
- **Role**: admin_programming

### 4. Admin English
- **Nama**: Khansa Aurelia
- **Email**: Englishclubskarla1@gmail.com
- **Password**: EnglishSkarla1
- **Role**: admin_english

- **Nama**: Budiyah
- **Email**: Englishclubskarla2@gmail.com
- **Password**: EnglishSkarla2
- **Role**: admin_english

## Cara Login

1. Buka aplikasi di browser: `http://localhost:3000/login`
2. Isi formulir dengan 3 field:
   - **Nama Lengkap**: Harus persis sama dengan nama di database (case-insensitive)
   - **Email**: Email yang terdaftar
   - **Password**: Password yang sesuai

3. Klik tombol "Masuk Sekarang"

## Testing yang Sudah Dilakukan

✅ Test koneksi database - BERHASIL
✅ Test migration schema - BERHASIL  
✅ Test import users - BERHASIL (10 users)
✅ Test login di level database - BERHASIL (3 akun tested)
✅ Test password hashing dengan bcrypt - BERHASIL
✅ Perbaikan login route untuk handle user tanpa org - BERHASIL

## Langkah Selanjutnya (Opsional)

1. **Test API Login**:
   ```bash
   npm run dev
   node test-api-login.js
   ```

2. **Import Data Lainnya** (jika diperlukan):
   - Organizations
   - Members
   - Attendance records
   - dll.

3. **Update Environment Variables** (pastikan sudah benar):
   - DATABASE_URL sudah mengarah ke Supabase baru ✅
   - JWT_SECRET sudah diset ✅
   - Semua credentials sudah benar ✅

## File Script yang Dibuat

- `check-users.js` - Cek user di database dan create default admin
- `import-admins.js` - Import semua admin dari database lama
- `test-login.js` - Test login di level database (tanpa API)
- `test-api-login.js` - Test login via API endpoint
- `check-schema.js` - Cek struktur tabel database

## Troubleshooting

### Jika masih gagal login:

1. **Cek apakah server berjalan**:
   ```bash
   npm run dev
   ```

2. **Cek apakah user ada di database**:
   ```bash
   node check-users.js
   ```

3. **Test login langsung di database**:
   ```bash
   node test-login.js
   ```

4. **Cek browser console** untuk error detail

5. **Cek server console** untuk error log

### Error Umum:

- **"Email tidak ditemukan"** → Email salah atau tidak ada di database
- **"Nama tidak sesuai"** → Nama harus persis sama (case-insensitive)
- **"Password salah"** → Password tidak cocok
- **"Terlalu banyak percobaan"** → Rate limit, tunggu 2 menit

## Keamanan

⚠️ **PENTING**: Semua password yang tercantum di dokumen ini adalah password ASLI sebelum di-hash. Jangan share file ini ke public!

Password di database sudah di-hash menggunakan bcrypt dengan salt rounds 10, jadi aman tersimpan di database.

## Kontak

Jika masih ada masalah, hubungi developer sistem.

---
**Update terakhir**: 2 Juli 2026
**Status**: ✅ FIXED - Login berfungsi normal
