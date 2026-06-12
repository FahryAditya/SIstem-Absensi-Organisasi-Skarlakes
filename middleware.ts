import { NextResponse, type NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'

const PUBLIC_PATHS = [
  '/login', 
  '/api/auth/login', 
  '/wawancara/scan', 
  '/api/wawancara/antrian', 
  '/api/wawancara/public',
  '/registration',
  '/api/registration',
  '/api/organizations'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow static assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  const session = await getSessionFromRequest(request)

  // Not authenticated — return 401 for API, redirect pages to login
  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect root to login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role names in DB are SUPER_ADMIN / ORG_ADMIN
  const role = session.role

  // Protect log aktivitas & system settings - SUPER_ADMIN only
  const isSuperAdminOnlyPath = pathname.startsWith('/log') || 
                               pathname.startsWith('/api/log') ||
                               pathname.startsWith('/admin/system') ||
                               pathname.startsWith('/api/admin/system')

  if (isSuperAdminOnlyPath && role !== 'SUPER_ADMIN') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Inject user info to headers for API routes
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', session.id.toString())
  requestHeaders.set('x-user-nama', session.nama)
  requestHeaders.set('x-user-role', role)
  if (session.activeOrgId) {
    requestHeaders.set('x-active-org-id', session.activeOrgId.toString())
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
