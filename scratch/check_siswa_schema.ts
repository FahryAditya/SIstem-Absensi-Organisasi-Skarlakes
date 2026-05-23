import { prisma } from '../lib/prisma'

async function checkSiswaColumns() {
  try {
    console.log('Checking columns for table "siswa"...')
    const columns: any[] = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'siswa'
    `
    console.log('Columns found:', columns.map(c => c.column_name).join(', '))
    
    const hasEmail = columns.some(c => c.column_name === 'email')
    if (hasEmail) {
      console.log('Column "email" EXISTS.')
    } else {
      console.log('Column "email" is MISSING!')
    }
  } catch (error) {
    console.error('Failed to check columns:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSiswaColumns()
