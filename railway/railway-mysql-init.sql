-- ============================================================
-- railway-mysql-init.sql
-- Jalankan SEKALI setelah MySQL Railway siap
-- Cara: Railway Dashboard → MySQL service → Query tab → paste & run
-- ATAU via CLI: railway run mysql < railway/railway-mysql-init.sql
-- ============================================================

-- Set charset default untuk mendukung karakter Indonesia & emoji
ALTER DATABASE railway CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verifikasi charset
SHOW VARIABLES LIKE 'character_set_database';
SHOW VARIABLES LIKE 'collation_database';

-- ============================================================
-- Tabel-tabel dibuat OTOMATIS oleh Prisma saat:
--   railway run npx prisma db push
--
-- Script ini hanya mengatur charset dan verifikasi koneksi.
-- ============================================================

-- Cek koneksi berhasil
SELECT 'Railway MySQL EkskulDash v2 siap!' AS status, NOW() AS waktu;
