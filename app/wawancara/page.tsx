import DashboardLayout from '@/components/layout/DashboardLayout'
import { getServerUser } from '@/lib/server-utils'
import { canAccessMpk, canAccessOsis } from '@/lib/auth'
import { redirect } from 'next/navigation'
import WawancaraClient from './WawancaraClient'

export default async function WawancaraPage() {
  const user = await getServerUser()
  if (!canAccessOsis(user.role) && !canAccessMpk(user.role)) redirect('/dashboard')

  return (
    <DashboardLayout user={user} pageTitle="Wawancara OSIS & MPK">
      <WawancaraClient user={user} />
    </DashboardLayout>
  )
}
