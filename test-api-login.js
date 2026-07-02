const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

async function testApiLogin() {
  try {
    const prisma = new PrismaClient();
    
    // Get a test user
    const user = await prisma.user.findFirst({
      select: { nama: true, email: true }
    });
    
    if (!user) {
      console.log('No users found in database');
      return;
    }
    
    console.log(`Testing login with: ${user.nama} (${user.email})`);
    
    // Test with incorrect password first to see if we get proper error
    const testData = {
      nama: user.nama,
      email: user.email,
      password: 'wrongpassword123'
    };
    
    console.log('Testing with wrong password...');
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.status >= 400 && response.status < 500) {
      console.log('✓ Properly handled authentication error');
    } else if (response.status >= 500) {
      console.log('✗ Server error occurred!');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Wait a bit for server to be ready
setTimeout(testApiLogin, 2000);