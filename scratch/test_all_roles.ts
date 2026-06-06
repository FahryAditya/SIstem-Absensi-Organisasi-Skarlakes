import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const roles = ['administrator', 'admin_programming', 'admin_english', 'admin_osis_mpk', 'user', '']

function getAccessibleOrgs(role: string): string[] {
  const cleanRole = (role || '').trim().toLowerCase()
  switch (cleanRole) {
    case 'administrator':      return ['programming', 'english', 'osis', 'mpk']
    case 'admin_programming':  return ['programming']
    case 'admin_english':      return ['english']
    case 'admin_osis_mpk':     return ['osis', 'mpk']
    default:                   return []
  }
}

async function test() {
  for (const role of roles) {
    console.log(`Testing role: "${role}"`)
    try {
      const accessibleOrgs = getAccessibleOrgs(role)
      const data = await prisma.registrationOsisMpk.findMany({
        where: {
          status: 'CALON',
          organization: {
            tipe: { in: accessibleOrgs as any }
          }
        },
        include: { organization: true }
      })
      console.log(`  Success! Found ${data.length} records`)
    } catch (error) {
      console.error(`  FAILED for role "${role}":`, error)
    }
  }
  await prisma.$disconnect()
}

test()
