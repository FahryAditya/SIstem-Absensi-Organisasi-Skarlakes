import { prisma } from '../lib/prisma'

async function run() {
  try {
    console.log('Querying DokumentasiFoto...')
    const count = await prisma.dokumentasiFoto.count()
    console.log('DokumentasiFoto count:', count)
  } catch (error) {
    console.error('DokumentasiFoto query failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

run()
