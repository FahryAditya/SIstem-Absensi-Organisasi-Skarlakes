import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardDokumentasiClient from './DashboardDokumentasiClient'

export default async function DashboardDokumentasiPage() {
  const user = await getServerUser()
  return (
    <DashboardLayout user={user} pageTitle="Manajemen Dokumentasi">
      <DashboardDokumentasiClient user={user} />
    </DashboardLayout>
  )
}
