import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { SessionUser } from './auth-shared'
import { z } from 'zod'

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

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret || secret === 'fallback-secret-change-this' || secret === 'ganti-dengan-secret-anda-yang-panjang-dan-aman-sekali-12345') {
    throw new Error('JWT_SECRET environment variable is not set. Set it in .env file with a secure random string.')
  }
  return new TextEncoder().encode(secret)
}

const sessionUserSchema = z.object({
  id: z.number().positive(),
  nama: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1),
  activeOrgId: z.number().optional(),
  orgIds: z.array(z.number()).default([]),
})

const COOKIE_NAME = 'ekskul_session'

function getBearerToken(req: NextRequest): string | null {
  const authorization = req.headers.get('authorization')
  if (!authorization) return null

  const [scheme, token] = authorization.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null

  return token
}

export async function signToken(payload: SessionUser): Promise<string> {
  const secret = getJwtSecret()
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret)
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
    const secret = getJwtSecret()
    const { payload } = await jwtVerify(token, secret)
    const parsed = sessionUserSchema.safeParse(payload)
    if (!parsed.success) return null
    return parsed.data as SessionUser
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
  const token = getBearerToken(req) || req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  
  const session = await verifyToken(token)
  if (!session) return null
  
  // Check if token is close to expiration (within 2 hours) using verified payload
  try {
    const secret = getJwtSecret()
    const { payload } = await jwtVerify(token, secret)
    const exp = (payload.exp as number) * 1000
    const now = Date.now()
    const twoHours = 2 * 60 * 60 * 1000
    
    if (exp - now < twoHours) {
      const newToken = await refreshToken(token)
      if (newToken) {
        req.headers.set('x-refresh-token', newToken)
      }
    }
  } catch {
    // Token verification already succeeded above, this is just for refresh logic
  }
  
  return session
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60, // 8 jam
    path: '/',
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
