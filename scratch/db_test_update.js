const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const id = 9;
  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true, nama: true, role: true } });
  console.log('Existing:', existing);

  const updateData = {
    nama: 'Sanjaya',
    email: 'tariskarla@gmail.com',
    role: 'organization_admin'
  };
  const organizationId = 5;

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id },
      data: updateData,
      select: { id: true, nama: true, email: true, role: true }
    });

    await tx.organizationAdmin.deleteMany({ where: { user_id: id } });
    if (organizationId) {
      await tx.organizationAdmin.create({
        data: {
          user_id: id,
          organization_id: organizationId
        }
      });
    }

    return user;
  });
  console.log('Updated:', updated);
}

main().catch(console.error).finally(() => prisma.$disconnect());
