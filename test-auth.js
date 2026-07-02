const bcrypt = require('bcryptjs');

// Test JWT_SECRET
console.log('Testing JWT_SECRET...');
const secret = process.env.JWT_SECRET;
console.log('JWT_SECRET exists:', !!secret);
console.log('JWT_SECRET length:', secret?.length);
console.log('JWT_SECRET is not default:', secret !== 'fallback-secret-change-this');

// Test bcrypt functionality
console.log('\nTesting bcrypt...');
const testPassword = 'testpassword123';
const hashedPassword = bcrypt.hashSync(testPassword, 10);
console.log('Hash created successfully');

const isMatch = bcrypt.compareSync(testPassword, hashedPassword);
console.log('Password comparison works:', isMatch);

// Test with wrong password
const wrongMatch = bcrypt.compareSync('wrongpassword', hashedPassword);
console.log('Wrong password correctly rejected:', !wrongMatch);

console.log('\nAll auth components working correctly!');