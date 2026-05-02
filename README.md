# Sistem Ekstrakurikuler Sekolah — Dashboard Absensi & Kas

Sistem manajemen absensi dan uang kas untuk **Ekstrakurikuler**, **OSIS**, dan **MPK**.

Stack: **Next.js 14** + **Prisma ORM** + **MySQL** (Docker) + **TypeScript** + **Tailwind CSS**

---

## 👤 Akun Default (Setelah Seed)

### 🔐 Administrator
| Field    | Value |
|----------|-------|
| Email    | `Fahryadityaadmin@gmail.com` |
| Password | `AdminstratorFahry` |
| Akses    | Semua data + Log Aktivitas + Kelola User |

### 💻 Admin Programming (3 akun)
| Email | Password |
|-------|----------|
| `Englishclubskarla1@gmail.com` | `EnglishSkarla1` |
| `Englishclubskarla2@gmail.com` | `EnglishSkarla2` |
| `Englishclubskarla3@gmail.com` | `EnglishSkarla3` |

### 🇬🇧 Admin English Club (3 akun)
| Email | Password |
|-------|----------|
| `programmingakarlakes1@gmail.com` | `pgskarlakes1` |
| `programmingakarlakes2@gmail.com` | `pgskarlakes2` |
| `programmingakarlakes3@gmail.com` | `pgskarlakes3` |

### 🏫 Admin OSIS & MPK (3 akun)
| Email | Password |
|-------|----------|
| `osismpkskarlakes1@gmail.com` | `osismpk1` |
| `osismpkskarlakes2@gmail.com` | `osismpk2` |
| `osismpkskarlakes3@gmail.com` | `osismpk3` |

> ✅ Semua password tersimpan sebagai **bcrypt hash** di database — tidak pernah plain text.

---

## 🚀 Cara Menjalankan (Docker)

### Prasyarat
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) terinstall
- [Node.js 20+](https://nodejs.org/) (untuk development lokal)

### 1. Clone & Setup Environment

```bash
git clone <repo-url>
cd ekskul-v2

# Salin file env
cp .env.example .env
```

Edit `.env` jika ingin mengubah password database:
```env
DATABASE_URL="mysql://ekskul_user:ekskul_pass@localhost:3306/ekskul_db"
JWT_SECRET="ganti-dengan-string-random-panjang-min-32-karakter"
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=ekskul_db
MYSQL_USER=ekskul_user
MYSQL_PASSWORD=ekskul_pass
```

### 2. Jalankan dengan Docker Compose

```bash
# Build dan jalankan semua service (MySQL + App)
docker compose up --build -d

# Cek status
docker compose ps

# Lihat logs
docker compose logs -f app
```

Aplikasi akan otomatis:
1. Menunggu MySQL siap
2. Menjalankan `prisma migrate deploy`
3. Menjalankan seed (10 akun + data contoh)
4. Menjalankan Next.js

Buka: **http://localhost:3000**

### 3. Stop & Restart

```bash
# Stop
docker compose down

# Stop + hapus data MySQL
docker compose down -v

# Restart
docker compose up -d
```

---

## 💻 Development Lokal (Tanpa Docker App)

```bash
# 1. Jalankan MySQL saja via Docker
docker compose up mysql -d

# 2. Install dependencies
npm install

# 3. Setup database
npx prisma generate
npx prisma db push
npx tsx scripts/seed.ts

# 4. Jalankan dev server
npm run dev
```

Buka: **http://localhost:3000**

### Prisma Studio (GUI database)
```bash
npx prisma studio
# Buka: http://localhost:5555
```

---

## 📁 Struktur Folder

```
ekskul-v2/
├── app/
│   ├── api/
│   │   ├── auth/         → login, logout, session
│   │   ├── siswa/        → CRUD siswa ekskul
│   │   ├── absensi/      → CRUD + bulk absensi ekskul
│   │   ├── organisasi/   → CRUD anggota OSIS & MPK
│   │   │   └── absensi/  → absensi OSIS & MPK
│   │   ├── users/        → kelola akun (administrator only)
│   │   ├── dashboard/    → stats & grafik
│   │   ├── log/          → audit trail (administrator only)
│   │   └── export/       → export Excel server-side
│   ├── dashboard/        → halaman dashboard
│   ├── siswa/            → halaman data siswa
│   ├── absensi/          → halaman absensi ekskul
│   ├── organisasi/       → halaman OSIS & MPK
│   ├── admin/            → kelola user (administrator)
│   ├── log/              → log aktivitas (administrator)
│   ├── export/           → halaman export
│   └── login/            → halaman login
├── components/
│   ├── layout/           → DashboardLayout, Sidebar, Topbar
│   └── ui/               → Table, Modal, ConfirmDialog, Badges
├── lib/
│   ├── prisma.ts         → Prisma client singleton
│   ├── auth.ts           → JWT session + role helpers
│   ├── log.ts            → audit log helper
│   ├── utils.ts          → format helpers
│   └── server-utils.ts   → getServerUser helper
├── prisma/
│   └── schema.prisma     → skema database MySQL
├── scripts/
│   └── seed.ts           → seed 10 akun + data contoh
├── docker/
│   ├── entrypoint.sh     → startup script container
│   └── mysql-init.sql    → inisialisasi charset MySQL
├── docker-compose.yml    → orchestrasi MySQL + App
├── Dockerfile            → build image Next.js
└── middleware.ts         → auth guard + role protection
```

---

## 🔒 Sistem Role & Akses

| Role | Programming | English | OSIS | MPK | Log | Kelola User |
|------|:-----------:|:-------:|:----:|:---:|:---:|:-----------:|
| Administrator | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin Programming | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Admin English Club | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Admin OSIS & MPK | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |

- Semua akses dikontrol di **middleware** (JWT) + **API routes** (server-side check)
- Password di-hash dengan **bcrypt** (salt rounds: 12)
- Session JWT berlaku **8 jam**
- OSIS dan MPK **dipisahkan** di tabel berbeda sesuai permintaan

---

## 📊 Fitur Lengkap

| Fitur | Status |
|-------|--------|
| Login dengan nama + email + password | ✅ |
| Welcome message setelah login | ✅ |
| Multi-role (4 tipe) | ✅ |
| Dashboard statistik + grafik | ✅ |
| CRUD Siswa (Programming & English) | ✅ |
| Input absensi bulk dengan status hadir/tidak/izin/sakit | ✅ |
| Tombol "Tandai Semua" | ✅ |
| Input uang kas + keterangan per siswa | ✅ |
| Riwayat absensi dengan filter tanggal | ✅ |
| CRUD Anggota OSIS (terpisah) | ✅ |
| CRUD Anggota MPK (terpisah) | ✅ |
| Absensi OSIS & MPK + jabatan | ✅ |
| Kelola User/Admin (Administrator) | ✅ |
| Log Aktivitas lengkap (before/after diff) | ✅ |
| Export Excel: absensi, rekap, siswa, organisasi | ✅ |
| Toast notification | ✅ |
| Konfirmasi hapus | ✅ |
| Pagination tabel | ✅ |
| Responsive mobile | ✅ |
| Loading skeleton | ✅ |
| Empty state | ✅ |
| Docker + MySQL | ✅ |
| Password bcrypt hash | ✅ |
| JWT session (httpOnly cookie) | ✅ |

---

## 🐳 Perintah Docker Berguna

```bash
# Masuk ke container MySQL
docker exec -it ekskul_mysql mysql -u ekskul_user -p ekskul_db

# Backup database
docker exec ekskul_mysql mysqldump -u root -prootpassword ekskul_db > backup.sql

# Restore database
docker exec -i ekskul_mysql mysql -u root -prootpassword ekskul_db < backup.sql

# Reset seed (hapus semua data, isi ulang)
docker exec ekskul_app npx tsx scripts/seed.ts

# Lihat logs realtime
docker compose logs -f
```

---

## ⚠️ Catatan Keamanan untuk Produksi

1. **Ganti JWT_SECRET** dengan string random panjang (min 64 karakter)
2. **Ganti password MySQL** di `.env`
3. **Aktifkan HTTPS** (via Nginx reverse proxy atau Cloudflare Tunnel)
4. Backup database secara rutin
5. Jangan expose port 3306 MySQL ke public

---

Dibuat untuk **SMK AIRLANGGA BALIKPAPAN ** • EkskulDash v2.0
