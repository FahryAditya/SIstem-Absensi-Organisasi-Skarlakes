const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$queryRaw`SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name LIKE '%dokumen%' OR table_name LIKE '%pengeluaran%' ORDER BY table_name, ordinal_position`
  .then(r => console.log(JSON.stringify(r, null, 2)))
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
