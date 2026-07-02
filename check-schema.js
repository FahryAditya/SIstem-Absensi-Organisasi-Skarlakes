const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkSchema() {
  try {
    console.log('Checking database schema...\n')
    
    // Check all tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `
    
    console.log('Tables in database:')
    tables.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.table_name}`)
    })
    
    console.log(`\nTotal tables: ${tables.length}`)
    
    // Check if organization_admins exists
    const hasOrgAdmins = tables.some(t => t.table_name === 'organization_admins')
    console.log(`\n✓ organization_admins table: ${hasOrgAdmins ? 'EXISTS' : 'MISSING'}`)
    
    // Check if users table exists and has data
    const userCount = await prisma.user.count()
    console.log(`✓ users table: EXISTS (${userCount} records)`)
    
    // Check if organizations table exists
    const orgCount = await prisma.organization.count()
    console.log(`✓ organizations table: EXISTS (${orgCount} records)`)
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkSchema()
