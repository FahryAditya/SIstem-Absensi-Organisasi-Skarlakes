# Rencana Implementasi: Pengaturan Email Pengirim oleh Administrator

Rencana ini bertujuan untuk menambahkan antarmuka di halaman **Kelola User** (khusus role `administrator`) agar dapat menyimpan informasi email pengirim (`GMAIL_FROM_EMAIL` dan `GMAIL_APP_PASSWORD`) ke dalam database. Data ini kemudian akan digunakan oleh semua admin untuk mengirimkan email pengumuman.

## User Review Required

> [!IMPORTANT]
> - Konfigurasi email pengirim disimpan secara terenkripsi sederhana atau text biasa di database. Karena ini adalah Sandi Aplikasi (App Password) Gmail 16-karakter yang terisolasi khusus untuk SMTP saja (bukan sandi utama akun Google Anda), tingkat risikonya rendah.
> - Jika data konfigurasi di database belum diisi, sistem akan otomatis menggunakan variabel lingkungan (`process.env.GMAIL_FROM_EMAIL` dan `process.env.GMAIL_APP_PASSWORD`) sebagai fallback.

## Proposed Changes

### Database Layer

#### [MODIFY] [schema.prisma](file:///c:/Users/ACER/Desktop/Sistem%20Ekstrakurikuler/prisma/schema.prisma)
Tambahkan model `EmailSetting` di akhir file:
```prisma
model EmailSetting {
  id           Int      @id @default(autoincrement())
  email        String   @db.VarChar(150)
  appPassword  String   @db.VarChar(255)
  updated_at   DateTime @updatedAt

  @@map("email_settings")
}
```

---

### Backend Layer

#### [NEW] [route.ts](file:///c:/Users/ACER/Desktop/Sistem%20Ekstrakurikuler/app/api/admin/email-setting/route.ts)
Buat route API baru untuk mengelola data setting email (GET untuk membaca, POST/PUT untuk menyimpan). Hanya role `administrator` yang diizinkan memanggil endpoint ini.

#### [MODIFY] [gmail.service.ts](file:///c:/Users/ACER/Desktop/Sistem%20Ekstrakurikuler/lib/services/gmail.service.ts)
Modifikasi fungsi `createGmailTransporter()` untuk memuat pengaturan dari database:
1. Lakukan query `prisma.emailSetting.findFirst()`.
2. Jika ada, gunakan `email` dan `appPassword` dari database tersebut.
3. Jika tidak ada, gunakan variabel di `.env` (baik `GMAIL_APP_PASSWORD` maupun Google Service Account).

---

### Frontend Layer

#### [MODIFY] [AdminClient.tsx](file:///c:/Users/ACER/Desktop/Sistem%20Ekstrakurikuler/app/admin/AdminClient.tsx)
1. Tambahkan tombol **"Pengirim Email"** di barisan tombol header (hanya jika role user login adalah `administrator`).
2. Tambahkan modal form input untuk `Alamat Email Pengirim` dan `Sandi Aplikasi (App Password)`.
3. Lakukan fetch data ke `/api/admin/email-setting` saat modal dibuka, dan kirim data POST/PUT saat disubmit.

---

## Verification Plan

### Automated/Manual Tests
1. Jalankan `npx prisma db push` untuk mengupdate skema database lokal/Neon.
2. Buka halaman Kelola User (`/admin`) sebagai Administrator.
3. Klik tombol **"Pengirim Email"**, isi data email & App Password, lalu klik Simpan.
4. Pastikan data berhasil tersimpan ke database.
5. Coba lakukan pengiriman email pengumuman melalui halaman `/admin/email` dan verifikasi apakah email berhasil terkirim menggunakan akun email baru tersebut.
