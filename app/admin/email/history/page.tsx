import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AdminEmailHistoryClient from './AdminEmailHistoryClient'

export const dynamic = 'force-dynamic'

export default async function AdminEmailHistoryPage() {
  const user = await getServerUser()

  return (
    <DashboardLayout user={user} pageTitle="Riwayat Kirim Email">
      <AdminEmailHistoryClient user={user} />
    </DashboardLayout>
  )
}
