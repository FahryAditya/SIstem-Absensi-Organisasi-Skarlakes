import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DokumentasiClient from './DokumentasiClient'

export const metadata = {
  title: 'Dokumentasi Foto Kegiatan',
}

export default async function DokumentasiPage() {
  const user = await getServerUser()

  return (
    <DashboardLayout user={user} pageTitle="Dokumentasi Foto Kegiatan">
      <DokumentasiClient user={user} />
    </DashboardLayout>
  )
}
