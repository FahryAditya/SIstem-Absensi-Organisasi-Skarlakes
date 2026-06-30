// Organization context utility to ensure data isolation
export function validateOrganizationAccess(
  userOrgIds: number[], 
  requestedOrgId: number | null,
  userRole: string
): { valid: boolean; error?: string } {
  // Super admin can access any organization
  if (userRole === 'SUPER_ADMIN' || userRole === 'administrator') {
    return { valid: true }
  }

  // Regular users must have access to the requested organization
  if (!requestedOrgId) {
    return { valid: false, error: 'No organization selected' }
  }

  if (!userOrgIds.includes(requestedOrgId)) {
    return { valid: false, error: 'Access denied to this organization' }
  }

  return { valid: true }
}

export function ensureOrganizationFilter(
  filter: any, 
  activeOrgId: number | undefined,
  userRole: string
): any {
  // Super admin can see all data if no org filter is specified
  if ((userRole === 'SUPER_ADMIN' || userRole === 'administrator') && !activeOrgId) {
    return filter
  }

  // All other cases must have organization_id filter
  if (!activeOrgId) {
    throw new Error('No active organization selected')
  }

  return {
    ...filter,
    organization_id: activeOrgId
  }
}

export function clearClientState() {
  // Utility function to be called from client-side when switching organizations
  if (typeof window !== 'undefined') {
    // Clear all localStorage data
    localStorage.removeItem('memberCache')
    localStorage.removeItem('attendanceCache') 
    localStorage.removeItem('kasCache')
    localStorage.removeItem('achievementCache')
    
    // Clear sessionStorage
    sessionStorage.clear()
    
    // Dispatch custom event to notify components to clear their state
    window.dispatchEvent(new CustomEvent('organizationSwitch'))
  }
}