export interface SessionUser {
  id: number
  nama: string
  email: string
  role: string
}

// Role labels
export const ROLE_LABELS: Record<string, string> = {
  administrator: 'Administrator',
  admin_programming: 'Admin Programming',
  admin_english: 'Admin English Club',
  admin_osis_mpk: 'Admin OSIS & MPK',
}

// Permission helpers
export function canAccessProgramming(role: string) {
  return role === 'administrator' || role === 'admin_programming'
}

export function canAccessEnglish(role: string) {
  return role === 'administrator' || role === 'admin_english'
}

export function canAccessOsis(role: string) {
  return role === 'administrator' || role === 'admin_osis_mpk'
}

export function canAccessMpk(role: string) {
  return role === 'administrator' || role === 'admin_osis_mpk'
}

export function canManageSiswaData(role: string) {
  return role === 'administrator'
    || role === 'admin_programming'
    || role === 'admin_english'
    || role === 'admin_osis_mpk'
}

export function canManageSiswaEkskul(role: string, ekskul: string) {
  return canManageSiswaData(role) && (ekskul === 'programming' || ekskul === 'english')
}

export function isAdministrator(role: string) {
  return role === 'administrator'
}

export function getAccessibleOrgs(role: string): string[] {
  switch (role) {
    case 'administrator':      return ['programming', 'english', 'osis', 'mpk']
    case 'admin_programming':  return ['programming']
    case 'admin_english':      return ['english']
    case 'admin_osis_mpk':     return ['osis', 'mpk']
    default:                   return []
  }
}
