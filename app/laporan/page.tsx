import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import ReportsClient from './ReportsClient'

export default async function ReportsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/login')
  }

  const user = await verifyToken(token)
  if (!user) {
    redirect('/login')
  }

  return <ReportsClient user={user} />
}
