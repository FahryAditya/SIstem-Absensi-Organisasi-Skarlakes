import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { SessionUser } from './auth-shared'

export type { SessionUser } from './auth-shared'

export { 
  isSuperAdmin, 
  isOrgAdmin, 
  canManageSystem, 
  canManageMembers,
  isAdministrator,
  getAccessibleOrgs,
  canAccessOsis,
  canAccessMpk,
  canAccessProgramming,
  canAccessEnglish,
  canAccessAmbilSiswa,
  canManageSiswaData,
  canManageSiswaEkskul
} from './auth-shared'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-this'
)
const COOKIE_NAME = 'ekskul_session'

export async function signToken(payload: SessionUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(JWT_SECRET)
}

export async function refreshToken(currentToken: string): Promise<string | null> {
  try {
    const session = await verifyToken(currentToken)
    if (!session) return null
    
    // Generate new token with same payload but extended expiration
    return await signToken(session)
  } catch {
    return null
  }
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  
  const session = await verifyToken(token)
  if (!session) return null
  
  // Check if token is close to expiration (within 2 hours)
  const payload = JSON.parse(atob(token.split('.')[1]))
  const exp = payload.exp * 1000 // Convert to milliseconds
  const now = Date.now()
  const twoHours = 2 * 60 * 60 * 1000 // 2 hours in milliseconds
  
  if (exp - now < twoHours) {
    // Token will expire within 2 hours, refresh it
    const newToken = await refreshToken(token)
    if (newToken) {
      // Set new token in response headers for client to update
      // This will be handled by middleware
      req.headers.set('x-refresh-token', newToken)
    }
  }
  
  return session
}

export function setSessionCookie(token: string) {
  const cookieStore = cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60, // 8 jam
    path: '/',
  })
}

export function clearSessionCookie() {
  const cookieStore = cookies()
  cookieStore.delete(COOKIE_NAME)
}
