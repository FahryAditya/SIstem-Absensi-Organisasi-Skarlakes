const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testLogin(email, password, nama) {
  try {
    console.log('\n=== Testing Login ===')
    console.log(`Email: ${email}`)
    console.log(`Name: ${nama}`)
    console.log(`Password: ${password}\n`)
    
    // 1. Find user by email (without organizations relation)
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      console.log('❌ FAIL: Email tidak ditemukan')
      return
    }
    console.log('✓ User found in database')
    console.log(`  DB Name: ${user.nama}`)
    console.log(`  DB Email: ${user.email}`)
    console.log(`  DB Role: ${user.role}`)
    
    // 2. Verify nama (case-insensitive)
    const namaMatch = user.nama.toLowerCase().trim() === nama.toLowerCase().trim()
    if (!namaMatch) {
      console.log(`❌ FAIL: Nama tidak sesuai`)
      console.log(`  Expected: ${user.nama}`)
      console.log(`  Provided: ${nama}`)
      return
    }
    console.log('✓ Name matches')
    
    // 3. Verify password
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      console.log('❌ FAIL: Password salah')
      return
    }
    console.log('✓ Password matches')
    
    console.log('\n✅ LOGIN SUCCESS!')
    console.log(`Welcome, ${user.nama}!`)
    console.log(`Role: ${user.role}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

// Test with multiple accounts
async function runTests() {
  await testLogin('Fahryadityasetiawann@gmail.com', 'AdministratorFahry', 'Fahry Aditya Setiawan')
  await testLogin('programmingakarlakes1@gmail.com', 'pgskarlakes1', 'Samuel Alden')
  await testLogin('osismpkskarlakes1@gmail.com', 'osismpk1', 'Eunike Devina')
}

runTests()
