import { getUserSession } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DokumentasiClient from './DokumentasiClient'

export const metadata = {
  title: 'Dokumentasi Foto Kegiatan',
}

export default async function DokumentasiPage() {
  const user = await getUserSession()
  const guestUser = { id: 0, nama: 'Tamu', email: '', role: 'guest' }

  return (
    <DashboardLayout user={user || guestUser} pageTitle="Dokumentasi Foto Kegiatan">
      <DokumentasiClient user={user || guestUser} />
    </DashboardLayout>
  )
}
