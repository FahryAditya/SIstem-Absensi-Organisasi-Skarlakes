-- SQL Script to Create Kegiatan Tables for Sistem Ekstrakurikuler
-- Run this script in your PostgreSQL Query Editor

-- 1. Create ENUMs
DO $$ BEGIN
    CREATE TYPE "TipeKegiatan" AS ENUM ('panitia', 'piket', 'petugas', 'rapat');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "OrganisasiWawancara" AS ENUM ('OSIS', 'MPK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Table Kegiatan
CREATE TABLE IF NOT EXISTS "kegiatan" (
    "id" SERIAL PRIMARY KEY,
    "nama_kegiatan" VARCHAR(100) NOT NULL,
    "tipe" "TipeKegiatan" NOT NULL,
    "tanggal" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Table Pengelompokan Kegiatan
CREATE TABLE IF NOT EXISTS "pengelompokan_kegiatan" (
    "id" SERIAL PRIMARY KEY,
    "kegiatan_id" INTEGER NOT NULL,
    "siswa_id" INTEGER NOT NULL,
    "organisasi" "OrganisasiWawancara" NOT NULL,
    "sub_kategori" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pengelompokan_kegiatan_kegiatan_id_fkey" FOREIGN KEY ("kegiatan_id") REFERENCES "kegiatan"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pengelompokan_kegiatan_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS "pengelompokan_kegiatan_kegiatan_id_idx" ON "pengelompokan_kegiatan"("kegiatan_id");
CREATE INDEX IF NOT EXISTS "pengelompokan_kegiatan_siswa_id_idx" ON "pengelompokan_kegiatan"("siswa_id");
