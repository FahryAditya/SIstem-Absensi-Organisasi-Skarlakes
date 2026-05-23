import { prisma } from '../lib/prisma';
(async () => {
  try {
    const count = await prisma.dokumentasiFoto.count();
    console.log('count', count);
  } catch (e) {
    console.error('Error', e);
  } finally {
    await prisma.$disconnect();
  }
})();
