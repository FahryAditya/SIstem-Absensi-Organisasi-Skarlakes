#!/bin/bash
# ============================================================
# seed-railway.sh
# Script untuk menjalankan migration + seed di Railway
# 
# Prasyarat: Railway CLI terinstall & sudah login
#   npm install -g @railway/cli
#   railway login
#   railway link  (pilih project EkskulDash)
#
# Cara pakai:
#   chmod +x railway/seed-railway.sh
#   ./railway/seed-railway.sh
# ============================================================

set -e

echo ""
echo "🚂 EkskulDash v2 — Railway Database Setup"
echo "==========================================="
echo ""

# Cek Railway CLI
if ! command -v railway &> /dev/null; then
  echo "❌ Railway CLI belum terinstall."
  echo "   Jalankan: npm install -g @railway/cli"
  exit 1
fi

# Cek login
echo "📋 Mengecek Railway session..."
railway whoami || { echo "❌ Belum login. Jalankan: railway login"; exit 1; }

echo ""
echo "🔄 Step 1: Push Prisma schema ke MySQL Railway..."
railway run npx prisma db push --accept-data-loss
echo "✅ Schema berhasil dipush!"

echo ""
echo "🌱 Step 2: Menjalankan seed (10 akun + data contoh)..."
railway run npx tsx scripts/seed.ts
echo "✅ Seed berhasil!"

echo ""
echo "🔍 Step 3: Verifikasi koneksi & data..."
railway run node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function check() {
  const users = await p.user.count();
  const siswa = await p.siswa.count();
  const osis  = await p.anggotaOsis.count();
  const mpk   = await p.anggotaMpk.count();
  console.log('Users     :', users);
  console.log('Siswa     :', siswa);
  console.log('Anggota OSIS:', osis);
  console.log('Anggota MPK :', mpk);
  await p.\$disconnect();
}
check().catch(e => { console.error(e); process.exit(1); });
"

echo ""
echo "🎉 Railway database setup selesai!"
echo ""
echo "📌 Akun Administrator:"
echo "   Email   : Fahryadityaadmin@gmail.com"
echo "   Password: AdminstratorFahry"
echo ""
echo "🌐 Buka aplikasi di Railway dashboard → Deployments → domain kamu"
echo ""
