export interface SessionUser {
  id: number
  nama: string
  email: string
  role: 'SUPER_ADMIN' | 'ORG_ADMIN'
  activeOrgId?: number // The organization the user is currently managing
  orgIds: number[]     // All organizations the user has access to
}

// Role labels
export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrator',
  ORG_ADMIN: 'Organization Admin',
}

export function isSuperAdmin(role: string) {
  return role === 'SUPER_ADMIN'
}

export function isOrgAdmin(role: string) {
  return role === 'ORG_ADMIN' || role === 'SUPER_ADMIN' || role === 'organization_admin'
}

export function canManageSystem(role: string) {
  return role === 'SUPER_ADMIN' || role === 'administrator'
}

export function canManageMembers(role: string) {
  return isOrgAdmin(role)
}

// --- COMPATIBILITY SHIMS (For Legacy Code) ---

export function isAdministrator(role: string) {
  return role === 'SUPER_ADMIN' || role === 'administrator'
}

export function getAccessibleOrgs(role: string): string[] {
  const r = (role || '').trim()
  if (r === 'SUPER_ADMIN' || r === 'administrator') return ['programming', 'english', 'osis', 'mpk']
  if (r === 'admin_programming') return ['programming']
  if (r === 'admin_english') return ['english']
  if (r === 'admin_osis_mpk') return ['osis', 'mpk']
  return []
}

export function canAccessOsis(role: string) {
  const r = (role || '').trim()
  return r === 'SUPER_ADMIN' || r === 'administrator' || r === 'admin_osis_mpk' || r === 'ORG_ADMIN'
}

export function canAccessMpk(role: string) {
  return canAccessOsis(role)
}

export function canAccessProgramming(role: string) {
  const r = (role || '').trim()
  return r === 'SUPER_ADMIN' || r === 'administrator' || r === 'admin_programming' || r === 'ORG_ADMIN'
}

export function canAccessEnglish(role: string) {
  const r = (role || '').trim()
  return r === 'SUPER_ADMIN' || r === 'administrator' || r === 'admin_english' || r === 'ORG_ADMIN'
}

export function canAccessAmbilSiswa(role: string) {
  return canAccessOsis(role)
}

export function canManageSiswaData(role: string) {
  return isOrgAdmin(role)
}

export function canManageSiswaEkskul(role: string, ekskul: string) {
  if (isSuperAdmin(role)) return true
  if (ekskul === 'programming') return canAccessProgramming(role)
  if (ekskul === 'english') return canAccessEnglish(role)
  return isOrgAdmin(role)
}
