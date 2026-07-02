const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const userCount = await prisma.user.count();
    console.log('Database connection successful!');
    console.log('Total users:', userCount);
    
    if (userCount > 0) {
      const sampleUser = await prisma.user.findFirst({
        select: { id: true, nama: true, email: true, role: true }
      });
      console.log('Sample user:', sampleUser);
    }
    
    await prisma.$disconnect();
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();