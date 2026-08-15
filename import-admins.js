const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function importAdmins() {
  try {
    console.log('Importing admin users to database...\n')
    
    // Data admin dari database lama
    const adminsData = [
      {
        id: 1,
        nama: 'Fahry Aditya Setiawan',
        email: 'Fahryadityasetiawann@gmail.com',
        password: 'AdministratorFahry',
        role: 'administrator',
      },
      {
        id: 2,
        nama: 'Eunike Devina',
        email: 'osismpkskarlakes1@gmail.com',
        password: 'osismpk1',
        role: 'admin_osis_mpk',
      },
      {
        id: 3,
        nama: 'Budiyah',
        email: 'Englishclubskarla2@gmail.com',
        password: 'EnglishSkarla2',
        role: 'admin_english',
      },
      {
        id: 4,
        nama: 'Khansa Aurelia',
        email: 'Englishclubskarla1@gmail.com',
        password: 'EnglishSkarla1',
        role: 'admin_english',
      },
      {
        id: 5,
        nama: 'Samuel Alden',
        email: 'programmingakarlakes1@gmail.com',
        password: 'pgskarlakes1',
        role: 'admin_programming',
      },
      {
        id: 7,
        nama: 'Kheysha Aqila',
        email: 'programmingskarlakes3@gmail.com',
        password: 'pgskarlakes3',
        role: 'admin_programming',
      },
      {
        id: 8,
        nama: 'Aisyah',
        email: 'programmingakarlakes2@gmail.com',
        password: 'pgskarlakes2',
        role: 'admin_programming',
      },
      {
        id: 9,
        nama: 'testsistem',
        email: 'testsistem@gmail.com',
        password: 'testsistem1',
        role: 'admin_osis_mpk',
      },
      {
        id: 10,
        nama: 'Meyshlla Carrolline',
        email: 'osismpkskarlakes2@gmail.com',
        password: 'osismpk2',
        role: 'admin_osis_mpk',
      },
      {
        id: 11,
        nama: 'Yezia Naftali',
        email: 'osismpkskarlakes3@gmail.com',
        password: 'osismpk3',
        role: 'admin_osis_mpk',
      },
    ]
    
    let success = 0
    let skipped = 0
    let errors = 0
    
    for (const admin of adminsData) {
      try {
        // Cek apakah user sudah ada
        const existing = await prisma.user.findUnique({
          where: { email: admin.email }
        })
        
        if (existing) {
          console.log(`⊘ Skipped: ${admin.nama} (${admin.email}) - already exists`)
          skipped++
          continue
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(admin.password, 10)
        
        // Insert user
        await prisma.user.create({
          data: {
            nama: admin.nama,
            email: admin.email,
            password: hashedPassword,
            role: admin.role,
          }
        })
        
        console.log(`✓ Imported: ${admin.nama} (${admin.email}) - Role: ${admin.role}`)
        success++
        
      } catch (error) {
        console.log(`✗ Error importing ${admin.nama}: ${error.message}`)
        errors++
      }
    }
    
    console.log('\n=== Import Summary ===')
    console.log(`✓ Successfully imported: ${success}`)
    console.log(`⊘ Skipped (already exists): ${skipped}`)
    console.log(`✗ Errors: ${errors}`)
    console.log(`Total: ${adminsData.length}`)
    
    console.log('\n=== Login Credentials ===')
    console.log('All users can login with:')
    console.log('  Nama: [Nama lengkap sesuai database]')
    console.log('  Email: [Email sesuai database]')
    console.log('  Password: [Password asli sebelum di-hash]')
    console.log('\nContoh:')
    console.log('  Nama: Fahry Aditya Setiawan')
    console.log('  Email: Fahryadityasetiawann@gmail.com')
    console.log('  Password: AdministratorFahry')
    
  } catch (error) {
    console.error('Fatal Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

importAdmins()
