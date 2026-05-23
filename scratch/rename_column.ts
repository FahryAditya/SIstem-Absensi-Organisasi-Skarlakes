import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tables = ['anggota_osis', 'anggota_mpk']
  for (const table of tables) {
    console.log(`Inspecting columns of table ${table}...`)
    try {
      const columns: any = await prisma.$queryRawUnsafe(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table}';`
      )
      console.log(`Columns of ${table}:`, columns)
    } catch (err: any) {
      console.error(`Error querying ${table}:`, err.message)
    }
  }
  await prisma.$disconnect()
}

main()
