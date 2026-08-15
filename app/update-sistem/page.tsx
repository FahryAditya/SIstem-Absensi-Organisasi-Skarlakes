import { getServerUser } from '@/lib/server-utils'
import { redirect } from 'next/navigation'
import UpdateSistemClient from '@/app/update-sistem/UpdateSistemClient'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default async function UpdateSistemPage() {
  const user = await getServerUser()
  
  // Allow SUPER_ADMIN and administrator to access
  if (user.role !== 'SUPER_ADMIN' && (user.role as string) !== 'administrator') {
    redirect('/dashboard')
  }

  return (
    <DashboardLayout user={user} pageTitle="Update Sistem">
      <UpdateSistemClient user={user} />
    </DashboardLayout>
  )
}
