export interface SessionUser {
  id: number
  nama: string
  email: string
  role: string // 'SUPER_ADMIN' | 'administrator' | 'admin_programming' | 'admin_english' | 'admin_osis_mpk' | 'organization_admin'
  activeOrgId?: number // The organization the user is currently managing
  orgIds: number[]     // All organizations the user has access to
}

// Role labels
export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrator',
  administrator: 'Administrator',
  admin_programming: 'Admin Programming',
  admin_english: 'Admin English Club',
  admin_osis_mpk: 'Admin OSIS & MPK',
  organization_admin: 'Organization Admin',
}

export function isSuperAdmin(role: string) {
  return role === 'SUPER_ADMIN' || role === 'administrator'
}

export function isOrgAdmin(role: string) {
  return role === 'ORG_ADMIN' || role === 'organization_admin' || isSuperAdmin(role)
}

export function canManageSystem(role: string) {
  return isSuperAdmin(role)
}

export function canManageMembers(role: string) {
  return isOrgAdmin(role)
}

// --- COMPATIBILITY SHIMS (For Legacy Code) ---

export function isAdministrator(role: string) {
  return isSuperAdmin(role)
}

export function getAccessibleOrgs(role: string): string[] {
  const r = (role || '').trim()
  if (r === 'SUPER_ADMIN' || r === 'administrator') return ['programming', 'english', 'osis', 'mpk']
  if (r === 'admin_programming') return ['programming']
  if (r === 'admin_english') return ['english']
  if (r === 'admin_osis_mpk') return ['osis', 'mpk']
  if (r === 'ORG_ADMIN' || r === 'organization_admin') return ['programming', 'english', 'osis', 'mpk']
  return []
}

export function canAccessOsis(role: string) {
  return isSuperAdmin(role) || role === 'admin_osis_mpk' || isOrgAdmin(role)
}

export function canAccessMpk(role: string) {
  return canAccessOsis(role)
}

export function canAccessProgramming(role: string) {
  return isSuperAdmin(role) || role === 'admin_programming' || isOrgAdmin(role)
}

export function canAccessEnglish(role: string) {
  return isSuperAdmin(role) || role === 'admin_english' || isOrgAdmin(role)
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
