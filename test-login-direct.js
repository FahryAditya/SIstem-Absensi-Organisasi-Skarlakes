// Test langsung dengan membuat request simulasi ke API route
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { SignJWT } = require('jose');

async function testLoginLogic() {
  try {
    console.log('=== Testing Login Logic Directly ===\n');
    
    const prisma = new PrismaClient();
    
    // Simulate input from user
    const inputData = {
      nama: 'Khansa Aurelia',
      email: 'Englishclubskarla1@gmail.com', 
      password: 'wrongpassword123'  // Using wrong password first
    };
    
    console.log('1. Testing with input:', inputData);
    
    // Step 1: Find user
    console.log('\n2. Finding user in database...');
    const user = await prisma.user.findUnique({ 
      where: { email: inputData.email },
      include: { organizations: true }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', { id: user.id, nama: user.nama, role: user.role });
    
    // Step 2: Check name match
    console.log('\n3. Checking name match...');
    const namaMatch = user.nama.toLowerCase().trim() === inputData.nama.toLowerCase().trim();
    console.log('Names match:', namaMatch);
    
    if (!namaMatch) {
      console.log('❌ Name does not match');
      return;
    }
    
    // Step 3: Check password
    console.log('\n4. Checking password...');
    console.log('Stored password (first 30 chars):', user.password.substring(0, 30));
    console.log('Is bcrypt hash?:', user.password.startsWith('$2'));
    
    const passwordMatch = await bcrypt.compare(inputData.password, user.password);
    console.log('Password matches:', passwordMatch);
    
    if (!passwordMatch) {
      console.log('❌ Wrong password (expected for this test)');
      
      // Now test with correct password if available
      console.log('\n5. What would happen with correct password...');
      
      // Test JWT creation
      console.log('\n6. Testing JWT creation...');
      const secret = process.env.JWT_SECRET;
      console.log('JWT_SECRET available:', !!secret);
      
      if (secret) {
        const orgIds = user.organizations.map(o => o.organization_id);
        const sessionUser = { 
          id: user.id, 
          nama: user.nama, 
          email: user.email, 
          role: user.role,
          orgIds: orgIds,
          activeOrgId: orgIds.length > 0 ? orgIds[0] : undefined
        };
        
        console.log('Session user object:', sessionUser);
        
        try {
          const encoder = new TextEncoder();
          const secretKey = encoder.encode(secret);
          
          const token = await new SignJWT(sessionUser)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('8h')
            .sign(secretKey);
          
          console.log('✅ JWT token created successfully, length:', token.length);
        } catch (jwtError) {
          console.log('❌ JWT creation failed:', jwtError.message);
        }
      } else {
        console.log('❌ JWT_SECRET not found!');
      }
      
      return;
    }
    
    await prisma.$disconnect();
    console.log('\n=== Test completed ===');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testLoginLogic();