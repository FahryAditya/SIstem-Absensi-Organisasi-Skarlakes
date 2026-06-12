import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AbsensiClient from './AbsensiClient'

export default async function AbsensiPage() {
  const user = await getServerUser()

  return (
    <DashboardLayout user={user} pageTitle="Absensi & Kas">
      <AbsensiClient user={user} />
    </DashboardLayout>
  )
}
