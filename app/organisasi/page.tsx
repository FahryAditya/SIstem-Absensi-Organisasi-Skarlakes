import { getServerUser } from '@/lib/server-utils'
import { canAccessOsis, canAccessMpk } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import OrganisasiClient from './OrganisasiClient'

export default async function OrganisasiPage({ searchParams }: { searchParams: { org?: string } }) {
  const user = await getServerUser()
  const org = (searchParams.org || '') as 'osis' | 'mpk' | ''

  if (org === 'osis' && !canAccessOsis(user.role)) redirect('/dashboard')
  if (org === 'mpk' && !canAccessMpk(user.role)) redirect('/dashboard')
  if (!org && !canAccessOsis(user.role) && !canAccessMpk(user.role)) redirect('/dashboard')

  const title = org === 'osis' ? 'OSIS' : org === 'mpk' ? 'MPK' : 'Organisasi'

  return (
    <DashboardLayout user={user} pageTitle={title}>
      <OrganisasiClient user={user} defaultOrg={org} />
    </DashboardLayout>
  )
}
