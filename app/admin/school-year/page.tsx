import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import SchoolYearClient from './SchoolYearClient'

export default async function SchoolYearPage() {
  const user = await getServerUser('administrator')
  return (
    <DashboardLayout user={user} pageTitle="Tahun Ajaran Baru">
      <SchoolYearClient user={user} />
    </DashboardLayout>
  )
}
