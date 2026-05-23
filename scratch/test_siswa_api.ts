import { canManageSiswaData } from '../lib/auth-shared'
import { prisma } from '../lib/prisma'

async function testSiswaGet() {
  const userRole = 'administrator' // Simulating admin
  const searchParams = new URLSearchParams('page=1&limit=15&ekskul=programming')
  
  const ekskul = searchParams.get('ekskul') as 'programming' | 'english' | null
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '15')

  try {
    const accessible: ('programming' | 'english')[] = canManageSiswaData(userRole) ? ['programming', 'english'] : []
    let ekskulFilter: ('programming' | 'english')[] = accessible
    if (ekskul && accessible.includes(ekskul)) ekskulFilter = [ekskul]

    const where = {
      ekskul: { in: ekskulFilter },
      ...(search ? { nama: { contains: search } } : {}),
    }

    console.log('Where clause:', JSON.stringify(where, null, 2))

    const [data, total] = await Promise.all([
      prisma.siswa.findMany({
        where,
        orderBy: [{ ekskul: 'asc' }, { nama: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.siswa.count({ where }),
    ])

    console.log('Success!')
    console.log('Total:', total)
    console.log('Data count:', data.length)
  } catch (error) {
    console.error('Failed to GET siswa:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testSiswaGet()
