import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import EditDokumentasiClient from './EditDokumentasiClient'

export default async function EditDokumentasiPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getServerUser()
  const { id } = await params
  return (
    <DashboardLayout user={user} pageTitle="Edit Dokumentasi">
      <EditDokumentasiClient user={user} id={id} />
    </DashboardLayout>
  )
}
