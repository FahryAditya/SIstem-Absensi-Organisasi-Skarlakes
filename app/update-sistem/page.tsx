import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import UpdateSistemClient from '@/app/update-sistem/UpdateSistemClient'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default async function UpdateSistemPage() {
  const user = await getSession()
  
  if (!user || user.role !== 'administrator') {
    redirect('/dashboard')
  }

  return (
    <DashboardLayout user={user} pageTitle="Update Sistem">
      <UpdateSistemClient user={user} />
    </DashboardLayout>
  )
}
