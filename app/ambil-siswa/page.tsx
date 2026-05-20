import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AmbilSiswaClient from './AmbilSiswaClient'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Ambil Anggota / Siswa Kegiatan',
}

export default async function AmbilSiswaPage() {
  const user = await getServerUser()
  
  // Ensure the user has one of the admin roles (which is all dashboard roles)
  const allowedRoles = ['administrator', 'admin_programming', 'admin_english', 'admin_osis_mpk']
  if (!allowedRoles.includes(user.role)) {
    redirect('/dashboard')
  }

  return (
    <DashboardLayout user={user} pageTitle="Ambil Anggota Kegiatan">
      <AmbilSiswaClient user={user} />
    </DashboardLayout>
  )
}
