import { getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PengeluaranClient from '@/app/pengeluaran/PengeluaranClient'

export const metadata = {
  title: 'Pengeluaran Kas - Sistem Ekstrakurikuler',
}

export default async function PengeluaranPage() {
  const user = await getServerUser()

  return (
    <DashboardLayout user={user} pageTitle="Pengeluaran Kas">
      <PengeluaranClient user={user} />
    </DashboardLayout>
  )
}
