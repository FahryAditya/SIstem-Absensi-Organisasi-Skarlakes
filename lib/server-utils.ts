import { cookies } from 'next/headers'
import { verifyToken, SessionUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export async function getServerUser(requiredRole?: string): Promise<SessionUser> {
  const cookieStore = cookies()
  const token = cookieStore.get('ekskul_session')?.value
  if (!token) redirect('/login')

  const user = await verifyToken(token)
  if (!user) redirect('/login')

  if (requiredRole && user.role !== requiredRole) redirect('/dashboard')

  return user
}
