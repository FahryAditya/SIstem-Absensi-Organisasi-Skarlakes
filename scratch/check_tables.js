const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
  .then(r => console.log(r))
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
