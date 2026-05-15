# 🚂 Railway Database Setup — EkskulDash v2

Folder ini berisi semua file konfigurasi untuk deploy **PostgreSQL database di Railway.app**
dan menghubungkannya dengan aplikasi EkskulDash v2.

---

## 📁 Isi Folder

```
railway/
├── README.md                  ← Panduan ini
├── .env.railway               ← Template env variable Railway
├── railway.toml               ← Konfigurasi Railway project
├── railway-postgresql-init.sql  ← SQL inisialisasi database (jalankan sekali)
├── seed-railway.sh            ← Script seed otomatis via Railway CLI
└── DEPLOYMENT_GUIDE.md        ← Panduan lengkap step-by-step
```

---

## ⚡ Quick Start (5 Menit)

### Langkah 1 — Deploy PostgreSQL di Railway

1. Buka [railway.app](https://railway.app) → Login
2. **New Project** → **Deploy PostgreSQL**
3. Tunggu deploy selesai (~1 menit)
4. Klik service PostgreSQL → tab **Variables** → salin `DATABASE_URL`

### Langkah 2 — Set Environment Variables App

Di Railway project kamu (service Next.js app), tambahkan:

```env
DATABASE_URL=${{PostgreSQL.DATABASE_URL}}
JWT_SECRET=ganti-dengan-random-string-panjang-minimal-64-karakter
```

> `${{PostgreSQL.DATABASE_URL}}` adalah Railway reference variable — otomatis terisi dari service PostgreSQL.

### Langkah 3 — Deploy App ke Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link ke project
railway link

# Deploy
railway up
```

### Langkah 4 — Jalankan Migration & Seed

```bash
# Via Railway CLI (remote exec)
railway run npx prisma db push
railway run npx tsx scripts/seed.ts
```

---

Lihat **DEPLOYMENT_GUIDE.md** untuk panduan lengkap dengan screenshot steps.
