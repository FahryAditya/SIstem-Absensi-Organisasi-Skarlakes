import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  try {
    const type = 'osis-mpk'
    const status = 'CALON'
    const userRole = 'admin_osis_mpk' // as reported by user context likely
    
    const getAccessibleOrgs = (role: string): string[] => {
      const cleanRole = (role || '').trim().toLowerCase()
      switch (cleanRole) {
        case 'administrator':      return ['programming', 'english', 'osis', 'mpk']
        case 'admin_programming':  return ['programming']
        case 'admin_english':      return ['english']
        case 'admin_osis_mpk':     return ['osis', 'mpk']
        default:                   return []
      }
    }

    const accessibleOrgs = getAccessibleOrgs(userRole)

    console.log('Parameters:', { type, status, accessibleOrgs })

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
    
    console.log('Result:', data)
  } catch (error) {
    console.error('CRASHED:', error)
  } finally {
    await prisma.$disconnect()
  }
}

test()
