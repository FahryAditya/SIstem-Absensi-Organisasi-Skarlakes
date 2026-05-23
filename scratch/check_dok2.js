import { prisma } from '../lib/prisma';
(async () => {
  try {
    const count = await prisma.dokumentasiFoto.count();
    console.log('DokumentasiFoto count:', count);
  } catch (e) {
    console.error('Error querying DokumentasiFoto:', e);
  } finally {
    await prisma.$disconnect();
  }
})();
