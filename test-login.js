const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('Testing login functionality...');
    
    // Get all users with their basic info
    const users = await prisma.user.findMany({
      select: { 
        id: true, 
        nama: true, 
        email: true, 
        role: true,
        password: true
      },
      take: 5
    });
    
    console.log('Available users:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Name: ${user.nama}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`\nTesting with user: ${testUser.nama} (${testUser.email})`);
      
      // Test password verification - check if password is bcrypt hashed
      console.log('Password sample (first 30 chars):', testUser.password.substring(0, 30));
      console.log('Is bcrypt hash?', testUser.password.startsWith('$2'));
      
      // Test if password is plain text (common issue)
      if (!testUser.password.startsWith('$2')) {
        console.log('ERROR: Password is not bcrypt hashed! This might be the issue.');
      } else {
        console.log('Password is properly hashed with bcrypt');
      }
    }
    
    await prisma.$disconnect();
    console.log('\nTest completed');
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testLogin();