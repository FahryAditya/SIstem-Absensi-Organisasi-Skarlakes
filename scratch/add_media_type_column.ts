import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "dokumentasi_foto" ADD COLUMN IF NOT EXISTS "media_type" VARCHAR(20) DEFAULT \'image\';')
    console.log('Kolom media_type berhasil ditambahkan (atau sudah ada).')
  } catch (err: any) {
    console.error('Error adding column:', err.message)
  }
  await prisma.$disconnect()
}

main()
