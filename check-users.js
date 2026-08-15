const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('Checking users in database...\n')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        password: true,
      }
    })
    
    console.log(`Total users found: ${users.length}\n`)
    
    if (users.length === 0) {
      console.log('No users found in database!')
      console.log('Creating default administrator user...\n')
      
      // Create default admin
      const hashedPassword = await bcrypt.hash('admin123', 10)
      const admin = await prisma.user.create({
        data: {
          nama: 'Administrator',
          email: 'admin@smkairlangga.sch.id',
          password: hashedPassword,
          role: 'administrator'
        }
      })
      
      console.log('✓ Default administrator created:')
      console.log('  Email: admin@smkairlangga.sch.id')
      console.log('  Password: admin123')
      console.log('  Name: Administrator')
      console.log('\nPlease login and change the password immediately!')
    } else {
      console.log('Users in database:')
      for (const user of users) {
        console.log(`\n  ID: ${user.id}`)
        console.log(`  Name: ${user.nama}`)
        console.log(`  Email: ${user.email}`)
        console.log(`  Role: ${user.role}`)
        console.log(`  Password hash starts with: ${user.password.substring(0, 20)}...`)
      }
    }
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
