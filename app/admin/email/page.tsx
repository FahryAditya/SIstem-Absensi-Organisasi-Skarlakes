import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AdminEmailClient from './AdminEmailClient'

export const dynamic = 'force-dynamic'

export default async function AdminEmailPage() {
  const user = await getServerUser()

  return (
    <DashboardLayout user={user} pageTitle="Kirim Email Notifikasi">
      <AdminEmailClient user={user} />
    </DashboardLayout>
  )
}
