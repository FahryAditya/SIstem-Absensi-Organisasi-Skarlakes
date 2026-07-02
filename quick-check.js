const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function quickCheck() {
  console.log('╔═══════════════════════════════════════════════════════════╗')
  console.log('║         QUICK CHECK - SISTEM EKSTRAKURIKULER              ║')
  console.log('╚═══════════════════════════════════════════════════════════╝')
  console.log()
  
  try {
    // 1. Database Connection
    console.log('1️⃣  Checking database connection...')
    await prisma.$queryRaw`SELECT 1`
    console.log('   ✅ Database connected\n')
    
    // 2. Users Count
    console.log('2️⃣  Checking users...')
    const userCount = await prisma.user.count()
    console.log(`   ✅ Found ${userCount} users\n`)
    
    if (userCount === 0) {
      console.log('   ⚠️  WARNING: No users found!')
      console.log('   Run: node import-admins.js\n')
      return
    }
    
    // 3. List Users
    const users = await prisma.user.findMany({
      select: { id: true, nama: true, email: true, role: true }
    })
    
    console.log('3️⃣  Available accounts:')
    console.log()
    
    const byRole = {}
    users.forEach(u => {
      if (!byRole[u.role]) byRole[u.role] = []
      byRole[u.role].push(u)
    })
    
    Object.keys(byRole).sort().forEach(role => {
      console.log(`   📌 ${role.toUpperCase()}:`)
      byRole[role].forEach(u => {
        console.log(`      • ${u.nama}`)
        console.log(`        Email: ${u.email}`)
      })
      console.log()
    })
    
    // 4. Organizations
    console.log('4️⃣  Checking organizations...')
    const orgCount = await prisma.organization.count()
    if (orgCount === 0) {
      console.log('   ⚠️  No organizations found (OK for now)\n')
    } else {
      console.log(`   ✅ Found ${orgCount} organizations\n`)
    }
    
    // 5. Tables
    console.log('5️⃣  Checking database schema...')
    const tables = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `
    console.log(`   ✅ Found ${tables[0].count} tables\n`)
    
    // 6. Summary
    console.log('╔═══════════════════════════════════════════════════════════╗')
    console.log('║                      SUMMARY                              ║')
    console.log('╚═══════════════════════════════════════════════════════════╝')
    console.log()
    console.log('  ✅ Database: Connected')
    console.log(`  ✅ Users: ${userCount} accounts ready`)
    console.log(`  ✅ Tables: ${tables[0].count} tables created`)
    console.log()
    console.log('  🎉 LOGIN READY!')
    console.log()
    console.log('  📖 For login instructions, see: LOGIN-INSTRUCTIONS.md')
    console.log('  📝 For full summary, see: PERBAIKAN-LOGIN-SUMMARY.md')
    console.log()
    console.log('  🚀 To start the app: npm run dev')
    console.log('  🌐 Then visit: http://localhost:3000/login')
    console.log()
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log()
    console.log('Troubleshooting:')
    console.log('  1. Check .env file has correct DATABASE_URL')
    console.log('  2. Run: npx prisma generate')
    console.log('  3. Run: npx prisma migrate deploy')
    console.log('  4. Run: node import-admins.js')
  } finally {
    await prisma.$disconnect()
  }
}

quickCheck()
