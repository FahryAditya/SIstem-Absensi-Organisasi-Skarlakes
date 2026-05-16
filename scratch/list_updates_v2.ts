import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const updates = await prisma.systemUpdate.findMany({
    orderBy: { created_at: 'desc' },
    include: { creator: { select: { nama: true } } }
  })
  
  if (updates.length === 0) {
    console.log("Belum ada pembaruan sistem yang dibuat.")
    return
  }

  console.log("Daftar Pembaruan Sistem:")
  updates.forEach(u => {
    console.log(`- [${u.version}] ${u.content} (Dibuat oleh: ${u.creator.nama} pada ${u.created_at})`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
