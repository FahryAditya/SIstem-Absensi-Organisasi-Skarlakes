import { prisma } from '../lib/prisma'
import { getAccessibleOrgs } from '../lib/auth-shared'

async function testDokumentasiGet() {
  const userRole = 'administrator'
  const searchParams = new URLSearchParams('')
  
  try {
    const orgFilter = searchParams.get('org') || ''
    const accessible = getAccessibleOrgs(userRole)
    
    const queryJudul = searchParams.get('q') || ''
    const dateStart = searchParams.get('start') || ''
    const dateEnd = searchParams.get('end') || ''

    const allowedOrgs = orgFilter && accessible.includes(orgFilter)
      ? [orgFilter]
      : accessible

    if (allowedOrgs.length === 0) {
      console.log('No allowed orgs')
      return
    }

    const where: any = {
      organisasi_type: { in: allowedOrgs as any[] },
      ...(queryJudul && {
        judul: {
          contains: queryJudul,
          mode: 'insensitive',
        },
      }),
    }

    const photos = await prisma.dokumentasiFoto.findMany({
      where,
      orderBy: { tanggal: 'desc' },
      include: {
        creator: {
          select: { nama: true, email: true },
        },
      },
    })

    console.log('Success!')
    console.log('Photos count:', photos.length)
  } catch (error: any) {
    console.error('Failed to GET dokumentasi:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDokumentasiGet()
