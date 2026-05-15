import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ImportClient from './ImportClient'

export default async function ImportPage() {
  const user = await getServerUser()
  return (
    <DashboardLayout user={user} pageTitle="Import Excel">
      <ImportClient user={user} />
    </DashboardLayout>
  )
}