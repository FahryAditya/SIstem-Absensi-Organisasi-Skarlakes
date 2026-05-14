import { getServerUser } from '@/lib/server-utils'
import { canManageSiswaData } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import SiswaClient from './SiswaClient'

export default async function SiswaPage({ searchParams }: { searchParams: { org?: string } }) {
  const user = await getServerUser()
  const org = (searchParams.org || '') as 'programming' | 'english' | ''

  // Access control
  if ((org === 'programming' || org === 'english' || !org) && !canManageSiswaData(user.role)) redirect('/dashboard')

  const title = org === 'programming' ? 'Siswa Programming'
    : org === 'english' ? 'Siswa English Club'
    : 'Data Siswa Ekskul'

  return (
    <DashboardLayout user={user} pageTitle={title}>
      <SiswaClient user={user} defaultOrg={org} />
    </DashboardLayout>
  )
}
