const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const count = await prisma.dokumentasiFoto.count();
    console.log('Berhasil mengakses tabel dokumentasi_foto, jumlah record:', count);
  } catch (e) {
    console.error('Error saat mengakses tabel:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
