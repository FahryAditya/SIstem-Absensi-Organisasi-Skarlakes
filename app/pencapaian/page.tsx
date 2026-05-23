import { getServerUser } from '@/lib/server-utils'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PencapaianClient from './PencapaianClient'

export default async function PencapaianPage() {
  const user = await getServerUser()

  if (!user) redirect('/login')

  return (
    <DashboardLayout user={user} pageTitle="Pencapaian & Achievements">
      <PencapaianClient user={user} />
    </DashboardLayout>
  )
}
