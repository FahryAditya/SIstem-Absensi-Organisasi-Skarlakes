import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AdminClient from './AdminClient'

export default async function AdminPage() {
  const user = await getServerUser('administrator')
  return (
    <DashboardLayout user={user} pageTitle="Kelola User & Admin">
      <AdminClient user={user} />
    </DashboardLayout>
  )
}
