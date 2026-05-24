const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    await prisma.();
    console.log('Connected to Neon');
    await prisma.();
    console.log('Disconnected successfully');
  } catch (e) {
    console.error('Connection failed:', e);
  }
}
main();
