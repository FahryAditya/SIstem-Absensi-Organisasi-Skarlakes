import { cookies } from 'next/headers'
import { verifyToken, SessionUser } from './auth'
import { redirect } from 'next/navigation'

const COOKIE_NAME = 'ekskul_session'

/**
 * Gets the current authenticated user from the session cookie.
 * Returns the user session if valid, otherwise redirects to /login.
 * For pages that need to handle auth failures without redirecting,
 * use getUserSession() instead.
 */
export async function getServerUser(requiredRole?: string): Promise<SessionUser> {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) redirect('/login')

  const user = await verifyToken(token)
  if (!user) redirect('/login')

  if (requiredRole && user.role !== requiredRole) redirect('/dashboard')

  return user
}

/**
 * Gets the current authenticated user WITHOUT redirecting.
 * Returns null if no valid session exists — use this when the page
 * needs to decide how to respond to auth failure itself.
 */
export async function getUserSession(): Promise<SessionUser | null> {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}
