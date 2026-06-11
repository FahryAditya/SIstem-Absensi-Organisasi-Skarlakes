-- SQL Script to Create Registration Tables for Sistem Ekstrakurikuler
-- Run this script in your PostgreSQL Query Editor (e.g., Neon Dashboard, DBeaver, TablePlus)

-- 1. Create ENUM Type for Registration Status
-- Note: If this fails because the type already exists, you can skip to step 2.
DO $$ BEGIN
    CREATE TYPE "RegistrationStatus" AS ENUM ('MENUNGGU', 'DITERIMA', 'DITOLAK', 'CALON');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Table for Extracurricular Registration (registration_eskul)
CREATE TABLE IF NOT EXISTS "registration_eskul" (
    "id" SERIAL PRIMARY KEY,
    "organization_id" INTEGER NOT NULL,
    "nama_peserta" VARCHAR(100) NOT NULL,
    "kelas" VARCHAR(50) NOT NULL,
    "kejuruan" VARCHAR(100) NOT NULL,
    "email_gmail" VARCHAR(100) NOT NULL,
    "nisn" VARCHAR(20),
    "status" "RegistrationStatus" NOT NULL DEFAULT 'MENUNGGU',
    "qr_token" VARCHAR(255),
    "qr_token_expired" TIMESTAMP(3),
    "accept_reason" TEXT,
    "reject_reason" TEXT,
    "accepted_by" INTEGER,
    "accepted_at" TIMESTAMP(3),
    "rejected_by" INTEGER,
    "rejected_at" TIMESTAMP(3),
    "email_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "registration_eskul_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 3. Create Table for OSIS & MPK Registration (registration_osis_mpk)
CREATE TABLE IF NOT EXISTS "registration_osis_mpk" (
    "id" SERIAL PRIMARY KEY,
    "organization_id" INTEGER NOT NULL,
    "nama_peserta" VARCHAR(100) NOT NULL,
    "kelas" VARCHAR(50) NOT NULL,
    "kejuruan" VARCHAR(100) NOT NULL,
    "email_gmail" VARCHAR(100) NOT NULL,
    "nisn" VARCHAR(20),
    "status" "RegistrationStatus" NOT NULL DEFAULT 'CALON',
    "qr_token" VARCHAR(255),
    "qr_token_expired" TIMESTAMP(3),
    "accept_reason" TEXT,
    "reject_reason" TEXT,
    "accepted_by" INTEGER,
    "accepted_at" TIMESTAMP(3),
    "rejected_by" INTEGER,
    "rejected_at" TIMESTAMP(3),
    "email_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "registration_osis_mpk_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 4. Create Table for Email Logs (email_log_registration)
CREATE TABLE IF NOT EXISTS "email_log_registration" (
    "id" SERIAL PRIMARY KEY,
    "registration_eskul_id" INTEGER,
    "registration_osis_mpk_id" INTEGER,
    "recipient_email" VARCHAR(100) NOT NULL,
    "email_type" VARCHAR(50) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL DEFAULT 'sent',
    "error_message" TEXT,
    CONSTRAINT "email_log_registration_registration_eskul_id_fkey" FOREIGN KEY ("registration_eskul_id") REFERENCES "registration_eskul"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "email_log_registration_registration_osis_mpk_id_fkey" FOREIGN KEY ("registration_osis_mpk_id") REFERENCES "registration_osis_mpk"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 5. Create Indexes for Performance and Uniqueness
-- Unique email per organization
CREATE UNIQUE INDEX IF NOT EXISTS "registration_eskul_email_gmail_organization_id_key" ON "registration_eskul"("email_gmail", "organization_id");
CREATE UNIQUE INDEX IF NOT EXISTS "registration_osis_mpk_email_gmail_organization_id_key" ON "registration_osis_mpk"("email_gmail", "organization_id");

-- Unique QR tokens
CREATE UNIQUE INDEX IF NOT EXISTS "registration_eskul_qr_token_key" ON "registration_eskul"("qr_token");
CREATE UNIQUE INDEX IF NOT EXISTS "registration_osis_mpk_qr_token_key" ON "registration_osis_mpk"("qr_token");

-- Status search optimization
CREATE INDEX IF NOT EXISTS "registration_eskul_status_idx" ON "registration_eskul"("status");
CREATE INDEX IF NOT EXISTS "registration_osis_mpk_status_idx" ON "registration_osis_mpk"("status");
