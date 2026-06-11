import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AdminExpClient from './AdminExpClient'

export default async function AdminExpPage() {
  const user = await getServerUser()
  return (
    <DashboardLayout user={user} pageTitle="Kelola EXP Anggota">
      <AdminExpClient user={user} />
    </DashboardLayout>
  )
}
