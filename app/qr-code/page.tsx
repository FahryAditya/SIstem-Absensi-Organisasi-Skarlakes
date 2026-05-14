import DashboardLayout from '@/components/layout/DashboardLayout'
import { getServerUser } from '@/lib/server-utils'
import { isAdministrator } from '@/lib/auth'
import { redirect } from 'next/navigation'
import QrCodeClient from './QrCodeClient'

export default async function QrCodePage() {
  const user = await getServerUser()
  if (!isAdministrator(user.role)) redirect('/dashboard')

  return (
    <DashboardLayout user={user} pageTitle="QR Code Wawancara">
      <QrCodeClient />
    </DashboardLayout>
  )
}
