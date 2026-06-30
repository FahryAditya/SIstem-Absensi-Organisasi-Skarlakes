import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest, SessionUser } from '@/lib/auth'

interface RBACOptions {
  requiredRoles?: string[]
  requiresOrgAccess?: boolean
  allowSuperAdmin?: boolean
  organizationId?: number
}

/**
 * RBAC Middleware utility for protecting API endpoints
 */
export async function withRBAC(
  req: NextRequest,
  options: RBACOptions = {}
): Promise<{ success: false; response: NextResponse } | { success: true; session: SessionUser }> {
  const {
    requiredRoles = [],
    requiresOrgAccess = false,
    allowSuperAdmin = true,
    organizationId
  } = options

  // Get session
  const session = await getSessionFromRequest(req)
  if (!session) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Unauthorized - Login required' }, { status: 401 })
    }
  }

  // Super admin bypass (if allowed)
  if (allowSuperAdmin && isSuperAdmin(session.role)) {
    return { success: true, session }
  }

  // Check required roles
  if (requiredRoles.length > 0 && !requiredRoles.includes(session.role)) {
    return {
      success: false,
      response: NextResponse.json({ 
        error: 'Dilarang - Role tidak memiliki akses' 
      }, { status: 403 })
    }
  }

  // Check organization access
  if (requiresOrgAccess) {
    const targetOrgId = organizationId || session.activeOrgId
    
    if (!targetOrgId) {
      return {
        success: false,
        response: NextResponse.json({ 
          error: 'No active organization selected' 
        }, { status: 400 })
      }
    }

    if (!session.orgIds.includes(targetOrgId)) {
      return {
        success: false,
        response: NextResponse.json({ 
          error: 'Dilarang - Akses ditolak untuk organisasi ini' 
        }, { status: 403 })
      }
    }
  }

  return { success: true, session }
}

/**
 * Protected endpoint wrapper
 */
export function protectedEndpoint(
  handler: (req: NextRequest, session: SessionUser) => Promise<NextResponse>,
  options: RBACOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const rbacResult = await withRBAC(req, options)
    
    if (!rbacResult.success) {
      return rbacResult.response
    }

    try {
      return await handler(req, rbacResult.session)
    } catch (error) {
      console.error('Protected endpoint error:', error)
      return NextResponse.json({ 
        error: 'Internal server error' 
      }, { status: 500 })
    }
  }
}

function isSuperAdmin(role: string): boolean {
  return role === 'SUPER_ADMIN' || role === 'administrator'
}

function isOrgAdmin(role: string): boolean {
  return role === 'ORG_ADMIN' || isSuperAdmin(role)
}

/**
 * Common RBAC configurations
 */
export const RBACConfigs = {
  SUPER_ADMIN_ONLY: {
    requiredRoles: ['SUPER_ADMIN', 'administrator'],
    allowSuperAdmin: true
  },
  
  ORG_ADMIN_ONLY: {
    requiredRoles: ['ORG_ADMIN', 'SUPER_ADMIN', 'administrator'],
    requiresOrgAccess: true,
    allowSuperAdmin: true
  },
  
  MEMBER_DELETE: {
    requiredRoles: ['ORG_ADMIN', 'SUPER_ADMIN', 'administrator'],
    requiresOrgAccess: true,
    allowSuperAdmin: true
  },
  
  DATABASE_CLEAR: {
    requiredRoles: ['SUPER_ADMIN', 'administrator'],
    allowSuperAdmin: true
  },
  
  XP_MANAGEMENT: {
    requiredRoles: ['ORG_ADMIN', 'SUPER_ADMIN', 'administrator'],
    requiresOrgAccess: true,
    allowSuperAdmin: true
  }
}

/**
 * Endpoint security decorator for critical operations
 */
export function secureEndpoint(config: keyof typeof RBACConfigs) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value
    descriptor.value = protectedEndpoint(method, RBACConfigs[config])
  }
}