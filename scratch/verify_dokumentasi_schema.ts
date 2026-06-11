import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const columns: any = await prisma.$queryRawUnsafe(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'dokumentasi_foto';`
    )
    console.log('Columns in dokumentasi_foto:', columns)
    
    const hasMediaType = columns.some((col: any) => col.column_name === 'media_type')
    if (!hasMediaType) {
        console.log('media_type not found, forcing ALTER...')
        await prisma.$executeRawUnsafe('ALTER TABLE "dokumentasi_foto" ADD COLUMN "media_type" VARCHAR(20) DEFAULT \'image\';')
        console.log('Successfully added media_type.')
    } else {
        console.log('media_type already exists.')
    }
  } catch (err: any) {
    console.error('Error:', err.message)
  }
  await prisma.$disconnect()
}

main()
