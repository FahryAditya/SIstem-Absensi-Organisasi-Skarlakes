import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const user = await getServerUser()
  return (
    <DashboardLayout user={user} pageTitle="Dashboard">
      <DashboardClient user={user} />
    </DashboardLayout>
  )
}
