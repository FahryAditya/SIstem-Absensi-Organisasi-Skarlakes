import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import SiswaClient from './SiswaClient'

export default async function SiswaPage() {
  const user = await getServerUser()

  return (
    <DashboardLayout user={user} pageTitle="Data Anggota">
      <SiswaClient user={user} />
    </DashboardLayout>
  )
}
