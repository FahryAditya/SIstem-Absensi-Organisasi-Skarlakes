import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import TambahDokumentasiClient from './TambahDokumentasiClient'

export default async function TambahDokumentasiPage() {
  const user = await getServerUser()
  return (
    <DashboardLayout user={user} pageTitle="Tambah Dokumentasi">
      <TambahDokumentasiClient user={user} />
    </DashboardLayout>
  )
}
