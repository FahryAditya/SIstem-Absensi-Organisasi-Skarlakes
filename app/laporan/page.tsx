import { getUserSession, getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ReportsClient from './ReportsClient'

export default async function ReportsPage() {
  // Use getUserSession so invalid/missing session does NOT throw redirect —
  // instead we handle it gracefully and re-check on the client side.
  let user = await getUserSession()

  if (!user) {
    // Re-check with strict redirect so the page still redirects if truly unauthenticated.
    // This extra call ensures we catch cases where getUserSession returns null but
    // the session IS actually valid (sync timing edge case).
    user = await getServerUser()
  }

  return (
    <DashboardLayout user={user} pageTitle="Laporan Statistik">
      <ReportsClient user={user} />
    </DashboardLayout>
  )
}
