import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  try {
    const type = 'osis-mpk'
    const status = 'CALON'
    const accessibleOrgs = ['osis', 'mpk', 'programming', 'english'] // simulated for admin

    console.log('Testing OSIS-MPK query...')
    const data = await prisma.registrationOsisMpk.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        organization: {
          tipe: { in: accessibleOrgs as any }
        }
      },
      include: { organization: true },
      orderBy: { created_at: 'desc' }
    })
    console.log('Success! Found', data.length, 'records')
  } catch (error) {
    console.error('Error during query:', error)
  } finally {
    await prisma.$disconnect()
  }
}

test()
