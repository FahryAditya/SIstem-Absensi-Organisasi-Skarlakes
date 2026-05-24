import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
dotenv.config()

const prisma = new PrismaClient()

async function main() {
  try {
    // Simulate what GET /api/siswa does when role = 'admin_osis_mpk'
    const userRole = 'admin_osis_mpk'
    
    // From canManageSiswaData: admin_osis_mpk returns true
    const accessible: ('programming' | 'english')[] = 
      ['administrator', 'admin_programming', 'admin_english', 'admin_osis_mpk'].includes(userRole)
        ? ['programming', 'english']
        : []
    
    console.log('canManageSiswaData:', accessible)
    
    // ekskulFilter determined by accessible
    const ekskulFilter = accessible
    
    if (ekskulFilter.length === 0) {
      console.log('Would return empty: ekskulFilter is empty!')
      return
    }
    
    const where = {
      ekskul: { in: ekskulFilter },
    }
    
    const [data, total] = await Promise.all([
      prisma.siswa.findMany({ where, take: 3 }),
      prisma.siswa.count({ where }),
    ])

    console.log('Query returned:', total, 'records')
    console.log('Data sample:', data.slice(0, 2))
    
    // Now test /api/organisasi with role 'admin_english'
    // canAccessOsis = false for admin_english
    // canAccessMpk = false for admin_english
    // So organisasi returns 403 Akses ditolak for tipe=osis or tipe=mpk
    console.log('\n--- English Club test ---')
    console.log('admin_english can access OSIS:', ['administrator', 'admin_osis_mpk'].includes('admin_english'))
    console.log('admin_english can access MPK:', ['administrator', 'admin_osis_mpk'].includes('admin_english'))

    // For English Club: route uses /api/siswa?ekskul=english
    // canManageSiswaData for admin_english = true (includes it)
    const accessibleEnglish: ('programming' | 'english')[] = ['programming', 'english']
    const englishFilter = accessibleEnglish
    
    const [englishData, englishTotal] = await Promise.all([
      prisma.siswa.findMany({ 
        where: { ekskul: { in: englishFilter } },
        take: 3 
      }),
      prisma.siswa.count({ where: { ekskul: { in: englishFilter } } }),
    ])
    console.log('English siswa count:', englishTotal, 'records')
    
  } catch (error: any) {
    console.error('Error:', error.message)
    console.error('Code:', error.code)
  } finally {
    await prisma.$disconnect()
  }
}

main()
