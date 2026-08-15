import { getAccessibleOrgs } from './auth-shared'

export function checkCanAccessDocumentation(userRole: string, organizationType: string) {
  const accessible = getAccessibleOrgs(userRole)
  return accessible.includes(organizationType)
}

export function canManageDocumentation(userRole: string, createdBy: number, currentUserId: number, organizationType: string) {
  // Creator can always manage their own
  if (createdBy === currentUserId) return true
  
  // Super admin can manage everything
  if (userRole === 'administrator') return true

  // Admin OSIS/MPK can manage OSIS, MPK, Programming, and English
  if (userRole === 'admin_osis_mpk') return true

  // Specific admins can manage their own org
  if (userRole === 'admin_programming' && organizationType === 'programming') return true
  if (userRole === 'admin_english' && organizationType === 'english') return true
  
  return false
}
