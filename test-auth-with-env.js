// Load environment variables
require('dotenv').config();

console.log('Testing environment loading...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length);
console.log('JWT_SECRET (first 20 chars):', process.env.JWT_SECRET?.substring(0, 20));

// Test JWT functionality
const { SignJWT } = require('jose');

async function testJWT() {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not found');
    }
    
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret);
    
    const payload = { test: 'data', userId: 123 };
    
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);
    
    console.log('JWT created successfully:', !!token);
    console.log('Token length:', token.length);
    
    return token;
  } catch (error) {
    console.error('JWT creation failed:', error.message);
    throw error;
  }
}

testJWT().then(() => {
  console.log('All JWT tests passed!');
}).catch(error => {
  console.error('JWT test failed:', error);
});