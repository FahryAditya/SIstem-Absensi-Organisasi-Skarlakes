-- ============================================================
-- OPTIMASI INDEX DATABASE
-- Jalankan di Supabase SQL Editor
-- Dibuat: 2026-05-17
-- Tujuan: Percepat query dengan 12 concurrent users, RAM 500MB
-- ============================================================

-- Index baru untuk hasil_wawancara
-- Mempercepat filter berdasarkan hasil (DITERIMA/DITOLAK/dll) dan sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS "hasil_wawancara_hasil_idx"
  ON "hasil_wawancara" ("hasil");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "hasil_wawancara_created_at_idx"
  ON "hasil_wawancara" ("created_at");

-- Index baru untuk system_updates
-- Mempercepat query "ambil update terbaru" dan filter per type
CREATE INDEX CONCURRENTLY IF NOT EXISTS "system_updates_created_at_idx"
  ON "system_updates" ("created_at" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "system_updates_update_type_idx"
  ON "system_updates" ("update_type");

-- ============================================================
-- Verifikasi index yang ada
-- ============================================================
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
