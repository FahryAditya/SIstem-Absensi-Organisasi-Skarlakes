import DashboardLayout from '@/components/layout/DashboardLayout'
import { getServerUser } from '@/lib/server-utils'
import { canAccessMpk, canAccessOsis, isAdministrator } from '@/lib/auth'
import { redirect } from 'next/navigation'
import WawancaraClient from './WawancaraClient'
import { prisma } from '@/lib/prisma'

export default async function WawancaraPage() {
  const user = await getServerUser()
  if (!canAccessOsis(user.role) && !canAccessMpk(user.role)) redirect('/dashboard')

  if (!isAdministrator(user.role)) {
    const active = await prisma.sesiWawancara.findFirst({
      where: {
        organisasi_type: { in: ['osis', 'mpk'] },
        status: 'ACTIVE'
      }
    })
    if (!active) {
      redirect('/dashboard')
    }
  }

  return (
    <DashboardLayout user={user} pageTitle="Wawancara OSIS & MPK">
      <WawancaraClient user={user} />
    </DashboardLayout>
  )
}
