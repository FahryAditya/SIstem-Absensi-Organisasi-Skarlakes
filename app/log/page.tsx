import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import LogClient from './LogClient'

export default async function LogPage() {
  const user = await getServerUser('administrator')
  return (
    <DashboardLayout user={user} pageTitle="Log Aktivitas">
      <LogClient />
    </DashboardLayout>
  )
}
