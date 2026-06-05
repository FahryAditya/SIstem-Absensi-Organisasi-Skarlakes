import { getServerUser } from '@/lib/server-utils'
import { canAccessOsis, canAccessMpk, isAdministrator } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import KegiatanClient from '../KegiatanClient'

export default async function KegiatanPage() {
  const user = await getServerUser()
  
  const authorized = isAdministrator(user.role) || canAccessOsis(user.role) || canAccessMpk(user.role)
  
  if (!authorized) {
    redirect('/dashboard')
  }

  return (
    <DashboardLayout user={user} pageTitle="Pengelompokan Kegiatan">
      <KegiatanClient user={user} />
    </DashboardLayout>
  )
}
