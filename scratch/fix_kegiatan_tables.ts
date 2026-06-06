import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const statements = [
    `DO $$ BEGIN
        CREATE TYPE "TipeKegiatan" AS ENUM ('panitia', 'piket', 'petugas', 'rapat');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;`,
    
    `DO $$ BEGIN
        CREATE TYPE "OrganisasiWawancara" AS ENUM ('OSIS', 'MPK');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;`,

    `CREATE TABLE IF NOT EXISTS "kegiatan" (
        "id" SERIAL PRIMARY KEY,
        "nama_kegiatan" VARCHAR(100) NOT NULL,
        "tipe" "TipeKegiatan" NOT NULL,
        "tanggal" DATE,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "pengelompokan_kegiatan" (
        "id" SERIAL PRIMARY KEY,
        "kegiatan_id" INTEGER NOT NULL,
        "siswa_id" INTEGER NOT NULL,
        "organisasi" "OrganisasiWawancara" NOT NULL,
        "sub_kategori" VARCHAR(50),
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "pengelompokan_kegiatan_kegiatan_id_fkey" FOREIGN KEY ("kegiatan_id") REFERENCES "kegiatan"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "pengelompokan_kegiatan_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,

    `CREATE INDEX IF NOT EXISTS "pengelompokan_kegiatan_kegiatan_id_idx" ON "pengelompokan_kegiatan"("kegiatan_id");`,
    `CREATE INDEX IF NOT EXISTS "pengelompokan_kegiatan_siswa_id_idx" ON "pengelompokan_kegiatan"("siswa_id");`
  ]

  console.log('Starting manual table creation for Kegiatan...')
  for (const sql of statements) {
    try {
      console.log('Executing statement...')
      await prisma.$executeRawUnsafe(sql)
    } catch (e: any) {
      console.error('Statement failed:', e.message)
    }
  }
  console.log('Finished.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
