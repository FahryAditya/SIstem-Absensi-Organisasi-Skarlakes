import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static files, API auth routes, and public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/register') ||
    /\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|avif|woff2?|ttf|eot|map|json)$/i.test(pathname) ||
    pathname === '/login'
  ) {
    return NextResponse.next()
  }

  // Check if it's an API route that needs authentication
  if (pathname.startsWith('/api/')) {
    const session = await getSessionFromRequest(request)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', session.id.toString())
    requestHeaders.set('x-user-role', session.role)
    requestHeaders.set('x-user-nama', session.nama || '')
    requestHeaders.set('x-user-org-ids', JSON.stringify(session.orgIds || []))
    if (session.activeOrgId) {
      requestHeaders.set('x-active-org-id', session.activeOrgId.toString())
    }

    // Create response and check for token refresh
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    
    const refreshToken = request.headers.get('x-refresh-token')
    
    if (refreshToken) {
      // Set refreshed token in cookie
      response.cookies.set('ekskul_session', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60, // 8 hours
        path: '/',
      })
    }
    
    return response
  }

  // For page routes, check authentication
  if (pathname !== '/' && pathname !== '/login') {
    const session = await getSessionFromRequest(request)
    
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Create response and check for token refresh
    const response = NextResponse.next()
    const refreshToken = request.headers.get('x-refresh-token')
    
    if (refreshToken) {
      // Set refreshed token in cookie
      response.cookies.set('ekskul_session', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60, // 8 hours
        path: '/',
      })
    }
    
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}