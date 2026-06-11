import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import OrganizationsClient from './OrganizationsClient'

export default async function OrganizationsPage() {
  const user = await getServerUser('administrator')
  return (
    <DashboardLayout user={user} pageTitle="Kelola Organisasi & Eskul">
      <OrganizationsClient user={user} />
    </DashboardLayout>
  )
}
