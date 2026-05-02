import { getServerUser } from '@/lib/server-utils'
import { canAccessProgramming, canAccessEnglish } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AbsensiClient from './AbsensiClient'

export default async function AbsensiPage({ searchParams }: { searchParams: { org?: string } }) {
  const user = await getServerUser()
  const org = (searchParams.org || '') as 'programming' | 'english' | ''

  if (org === 'programming' && !canAccessProgramming(user.role)) redirect('/dashboard')
  if (org === 'english' && !canAccessEnglish(user.role)) redirect('/dashboard')
  if (!org && !canAccessProgramming(user.role) && !canAccessEnglish(user.role)) redirect('/dashboard')

  const title = org === 'programming' ? 'Absensi Programming'
    : org === 'english' ? 'Absensi English Club'
    : 'Absensi Ekskul'

  return (
    <DashboardLayout user={user} pageTitle={title}>
      <AbsensiClient user={user} defaultOrg={org} />
    </DashboardLayout>
  )
}
