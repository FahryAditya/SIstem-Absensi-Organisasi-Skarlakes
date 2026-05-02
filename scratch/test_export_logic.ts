import { PrismaClient } from '@prisma/client'
import { getAccessibleOrgs } from '../lib/auth-shared'

const prisma = new PrismaClient()

async function testExport(userRole: string, org: string) {
    const orgs = getAccessibleOrgs(userRole).filter(o => ['programming', 'english'].includes(o))
    const filter = org && orgs.includes(org) ? [org] : orgs
    
    console.log(`Role: ${userRole}, Filter Org: ${org} -> Resulting Filter:`, filter)
    
    const data = await prisma.siswa.findMany({
      where: { ekskul: { in: filter as any } },
    })
    
    console.log(`Found ${data.length} records.`)
}

async function main() {
    await testExport('administrator', '')
    await testExport('admin_programming', '')
    await testExport('admin_english', '')
}

main().catch(console.error).finally(() => prisma.$disconnect())
