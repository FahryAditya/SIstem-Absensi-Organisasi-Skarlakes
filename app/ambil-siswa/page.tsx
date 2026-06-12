import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AmbilSiswaClient from './AmbilSiswaClient'
import { redirect } from 'next/navigation'
import { canAccessAmbilSiswa } from '@/lib/auth-shared'

export const metadata = {
  title: 'Ambil Anggota / Siswa Kegiatan',
}

export default async function AmbilSiswaPage() {
  const user = await getServerUser()
  
  if (!canAccessAmbilSiswa(user.role)) {
    redirect('/dashboard')
  }

  return (
    <DashboardLayout user={user} pageTitle="Ambil Anggota Kegiatan">
      <AmbilSiswaClient user={user} />
    </DashboardLayout>
  )
}
