import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import OrganizationsClient from './OrganizationsClient'
import { redirect } from 'next/navigation'

export default async function OrganizationsPage() {
  const user = await getServerUser()
  // Only administrator or SUPER_ADMIN can access
  if (user.role !== 'SUPER_ADMIN' && (user.role as string) !== 'administrator') redirect('/dashboard')
  return (
    <DashboardLayout user={user} pageTitle="Kelola Organisasi & Eskul">
      <OrganizationsClient user={user} />
    </DashboardLayout>
  )
}
