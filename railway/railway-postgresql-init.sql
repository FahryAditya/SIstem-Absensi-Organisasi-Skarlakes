-- ============================================================
-- railway-postgresql-init.sql
-- Jalankan SEKALI setelah PostgreSQL Railway siap
-- Cara: Railway Dashboard → PostgreSQL service → Query tab → paste & run
-- ATAU via CLI: railway run postgresql < railway/railway-postgresql-init.sql
-- ============================================================

-- Set timezone untuk Indonesia (WIB/WITA/WIT)
ALTER DATABASE railway SET timezone TO 'Asia/Jakarta';

-- Verifikasi timezone
SHOW timezone;

-- ============================================================
-- Tabel-tabel dibuat OTOMATIS oleh Prisma saat:
--   railway run npx prisma db push
--
-- Script ini hanya mengatur timezone dan verifikasi koneksi.
-- ============================================================

-- Cek koneksi berhasil
SELECT 'Railway PostgreSQL EkskulDash v2 siap!' AS status, NOW() AS waktu;
