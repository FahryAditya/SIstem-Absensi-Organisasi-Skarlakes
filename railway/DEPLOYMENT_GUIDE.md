# 📖 Panduan Deploy Lengkap — EkskulDash v2 ke Railway

Deploy backend MySQL + aplikasi Next.js ke Railway.app secara gratis (Hobby plan $5/bulan atau Free trial).

---

## 🧰 Yang Dibutuhkan

- Akun [Railway.app](https://railway.app) (daftar gratis)
- Akun [GitHub](https://github.com) (untuk push kode)
- [Node.js 20+](https://nodejs.org) di komputer lokal
- [Railway CLI](https://docs.railway.app/guides/cli) (opsional tapi sangat membantu)

---

## 📐 Arsitektur di Railway

```
Railway Project: ekskul-dashboard
├── Service: MySQL        ← Database utama (Railway managed)
│     Port: 3306 (internal)
│     Database: railway
│
└── Service: ekskul-app   ← Next.js app
      Port: 3000
      Domain: xxx.up.railway.app
      Env: DATABASE_URL → reference ke MySQL service
```

---

## 🚀 BAGIAN 1 — Setup MySQL di Railway

### Step 1.1 — Buat Project Baru

1. Login ke [railway.app](https://railway.app)
2. Klik **"New Project"**
3. Pilih **"Deploy MySQL"**

![Railway New Project](https://docs.railway.app/images/guides/mysql.png)

Railway akan otomatis:
- Deploy MySQL 8.0
- Buat database `railway`
- Generate kredensial acak

### Step 1.2 — Catat Connection Details

Setelah MySQL running:
1. Klik service **MySQL**
2. Tab **"Variables"** — catat nilai:
   - `MYSQL_URL` → ini adalah `DATABASE_URL` aplikasi
   - `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`
3. Tab **"Connect"** → kamu bisa akses MySQL via:
   - Railway CLI: `railway connect MySQL`
   - External client (TablePlus, DBeaver) menggunakan Public URL

### Step 1.3 — Inisialisasi Charset (Opsional tapi Disarankan)

Di tab **"Query"** Railway MySQL, jalankan:

```sql
ALTER DATABASE railway CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SELECT 'OK' AS status;
```

---

## 🚀 BAGIAN 2 — Deploy Aplikasi ke Railway

### Step 2.1 — Push Kode ke GitHub

```bash
cd ekskul-v2

# Init git
git init
git add .
git commit -m "feat: EkskulDash v2 initial commit"

# Buat repo di GitHub (via web atau gh CLI)
gh repo create ekskul-dashboard --private --source=. --push

# Atau manual:
git remote add origin https://github.com/USERNAME/ekskul-dashboard.git
git push -u origin main
```

### Step 2.2 — Tambah Service App di Railway

1. Di Railway project yang sama (tempat MySQL), klik **"New Service"**
2. Pilih **"GitHub Repo"**
3. Pilih repo `ekskul-dashboard`
4. Railway otomatis detect Next.js

### Step 2.3 — Salin `railway.toml` ke Root Project

File `railway/railway.toml` perlu dipindah ke root project agar Railway membacanya:

```bash
# Di root folder ekskul-v2
cp railway/railway.toml railway.toml
git add railway.toml
git commit -m "chore: add railway.toml config"
git push
```

### Step 2.4 — Set Environment Variables

Di Railway → service `ekskul-app` → tab **"Variables"**, tambahkan:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `${{MySQL.MYSQL_URL}}` |
| `JWT_SECRET` | (lihat cara generate di bawah) |
| `NODE_ENV` | `production` |
| `PRISMA_CLI_BINARY_TARGETS` | `linux-musl-openssl-3.0.x` |

> ⚠️ **PENTING**: `${{MySQL.MYSQL_URL}}` adalah **Railway Reference Variable** — Railway akan otomatis mengisi nilai dari service MySQL di project yang sama. Ketik persis seperti itu.

#### Generate JWT_SECRET yang Aman

Jalankan di terminal lokal:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Salin hasilnya ke `JWT_SECRET`.

### Step 2.5 — Trigger Deploy

Setelah env variable tersimpan, Railway otomatis re-deploy. Atau klik **"Deploy"** manual.

Build process:
1. Railway clone repo
2. Jalankan `npx prisma generate && npm run build` (dari `railway.toml`)
3. Start dengan `npx prisma db push && npm start`

---

## 🌱 BAGIAN 3 — Seed Database

Setelah app running, jalankan seed untuk membuat 10 akun admin:

### Opsi A — Via Railway CLI (Direkomendasikan)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link ke project
railway link
# Pilih project ekskul-dashboard

# Jalankan seed
railway run npx tsx scripts/seed.ts
```

### Opsi B — Via Railway Dashboard

1. Service `ekskul-app` → tab **"Deploy"** → **"Shell"**
2. Jalankan:
```bash
npx tsx scripts/seed.ts
```

### Opsi C — Script Otomatis

```bash
chmod +x railway/seed-railway.sh
./railway/seed-railway.sh
```

---

## ✅ BAGIAN 4 — Verifikasi

### Cek App Berjalan

1. Railway → service `ekskul-app` → tab **"Settings"** → **"Domains"**
2. Klik domain (contoh: `ekskul-dashboard.up.railway.app`)
3. Harus redirect ke halaman login

### Test Login

Buka domain Railway, login dengan:
- **Email**: `Fahryadityaadmin@gmail.com`
- **Password**: `AdminstratorFahry`
- **Nama**: `Fahry Aditya`

### Verifikasi Database via CLI

```bash
# Cek jumlah data
railway run node -e "
const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
p.user.count().then(n => { console.log('Total users:', n); p.\$disconnect(); });
"
```

---

## 🔧 BAGIAN 5 — Konfigurasi Tambahan

### Custom Domain (Opsional)

1. Railway → service → **"Settings"** → **"Custom Domain"**
2. Masukkan domain kamu (contoh: `ekskul.smakarla.sch.id`)
3. Tambahkan CNAME record di DNS provider:
   ```
   CNAME  ekskul  →  xxx.up.railway.app
   ```

### Auto-Deploy dari GitHub

Railway otomatis deploy setiap kali push ke branch `main`. Untuk disable:
- Service → **"Settings"** → **"Deploy"** → matikan **"Auto Deploy"**

### Backup Database

```bash
# Backup via Railway CLI
railway connect MySQL
# Kemudian di dalam MySQL shell:
mysqldump railway > backup_$(date +%Y%m%d).sql
```

---

## 💰 Estimasi Biaya Railway

| Plan | Harga | Keterangan |
|------|-------|------------|
| Free Trial | $0 | $5 credit, cukup untuk testing |
| Hobby | $5/bulan | 2 services (MySQL + App), 512MB RAM each |
| Pro | $20/bulan | Resource lebih besar, custom domains |

Untuk EkskulDash sekolah, **Hobby plan ($5/bulan)** sudah lebih dari cukup.

---

## 🆘 Troubleshooting

### ❌ Error: "Can't reach database server"

Pastikan `DATABASE_URL` menggunakan Railway reference variable:
```
DATABASE_URL=${{MySQL.MYSQL_URL}}
```
Bukan nilai hardcoded.

### ❌ Error: "Prisma Client not generated"

Tambahkan env variable:
```
PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x
```
Kemudian redeploy.

### ❌ Build gagal: "npm run build failed"

Cek logs build di Railway. Kemungkinan penyebab:
- TypeScript error → cek kode lokal dulu dengan `npm run build`
- Missing env variable saat build → tambahkan `DATABASE_URL` dummy untuk build

### ❌ Seed gagal: "already exists"

Normal — seed sudah pernah dijalankan. Data tidak akan di-overwrite karena ada pengecekan `findUnique` sebelum insert.

### ❌ App crash loop

Cek logs di Railway → service → tab **"Logs"**. Kemungkinan:
- `JWT_SECRET` belum diset
- `DATABASE_URL` salah format

---

## 📞 Support

- Railway docs: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Prisma docs: [pris.ly/d/railway](https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-railway)
