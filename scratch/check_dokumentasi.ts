import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Testing prisma.dokumentasiFoto...')
    const photos = await prisma.dokumentasiFoto.findMany({
      take: 5
    })
    console.log('Photos retrieved successfully:', photos)
  } catch (error) {
    console.error('Error retrieving photos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
