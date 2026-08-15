import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import LogClient from './LogClient'
import { redirect } from 'next/navigation'

export default async function LogPage() {
  const user = await getServerUser()
  if (user.role !== 'SUPER_ADMIN' && (user.role as string) !== 'administrator') redirect('/dashboard')
  return (
    <DashboardLayout user={user} pageTitle="Log Aktivitas">
      <LogClient />
    </DashboardLayout>
  )
}
