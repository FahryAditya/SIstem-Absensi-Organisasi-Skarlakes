import { getServerUser } from '@/lib/server-utils'
import { getAccessibleOrganizations } from '@/lib/services/organization-service'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AbsensiClient from './AbsensiClient'

export default async function AbsensiPage({ searchParams }: { searchParams: { org?: string } }) {
  const user = await getServerUser()
  const accessible = await getAccessibleOrganizations(user.id, user.role)
  
  if (accessible.length === 0) redirect('/dashboard')

  const orgSlug = searchParams.org || ''
  const selectedOrg = orgSlug ? accessible.find(o => o.slug === orgSlug) : null
  
  if (orgSlug && !selectedOrg) redirect('/dashboard')

  const title = selectedOrg ? `Absensi ${selectedOrg.nama}` : 'Absensi & Kas'

  return (
    <DashboardLayout user={user} pageTitle={title}>
      <AbsensiClient user={user} defaultOrg={orgSlug} />
    </DashboardLayout>
  )
}
