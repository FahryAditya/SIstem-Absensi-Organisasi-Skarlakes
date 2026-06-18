import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AdminClient from './AdminClient'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const user = await getServerUser()
  // Only administrator or SUPER_ADMIN can access
  if (user.role !== 'SUPER_ADMIN' && (user.role as string) !== 'administrator') redirect('/dashboard')
  return (
    <DashboardLayout user={user} pageTitle="Kelola User & Admin">
      <AdminClient user={user} />
    </DashboardLayout>
  )
}
