import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ExportClient from './ExportClient'

export default async function ExportPage() {
  const user = await getServerUser()
  return (
    <DashboardLayout user={user} pageTitle="Export Data">
      <ExportClient user={user} />
    </DashboardLayout>
  )
}
