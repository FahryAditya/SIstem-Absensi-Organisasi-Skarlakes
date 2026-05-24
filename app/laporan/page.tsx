import { getUserSession, getServerUser } from '@/lib/server-utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ReportsClient from './ReportsClient'

export default async function ReportsPage() {
  // Primary: non-redirecting session check — if the session is present we get
  // the user immediately; if not, getUserSession() returns null without
  // forcing the session into an unwanted early-return/no-value path that
  // could cause next/navigation to natively redirect (/login) before our
  // JSX ever has a chance to guard itself.
  let user = await getUserSession()

  if (!user) {
    // Fall back to the strict getServerUser path so truly unauthenticated
    // visitors are still redirected to /login — we avoid that only for cases
    // where the session is present but the cookie or token looks invalid in a
    // way that getUserSession already covered.
    user = await getServerUser()
  }

  return (
    <DashboardLayout user={user} pageTitle="Laporan Statistik">
      <ReportsClient user={user} />
    </DashboardLayout>
  )
}
