const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const osisData = await prisma.absensiOrganisasi.findMany({
      where: { organisasi_type: 'osis' },
      select: { id: true, status: true, tanggal: true },
      take: 20
    });
    console.log('OSIS Data Sample:', JSON.stringify(osisData, null, 2));

    const mpkData = await prisma.absensiOrganisasi.findMany({
      where: { organisasi_type: 'mpk' },
      select: { id: true, status: true, tanggal: true },
      take: 20
    });
    console.log('MPK Data Sample:', JSON.stringify(mpkData, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
