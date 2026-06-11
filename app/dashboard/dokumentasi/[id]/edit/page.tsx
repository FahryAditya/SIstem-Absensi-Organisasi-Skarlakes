import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import EditDokumentasiClient from './EditDokumentasiClient'

export default async function EditDokumentasiPage({ params }: { params: { id: string } }) {
  const user = await getServerUser()
  return (
    <DashboardLayout user={user} pageTitle="Edit Dokumentasi">
      <EditDokumentasiClient user={user} id={params.id} />
    </DashboardLayout>
  )
}
