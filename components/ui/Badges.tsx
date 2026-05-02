import { ORG_LABELS, STATUS_LABELS, OrgType } from '@/lib/utils'

export function OrgBadge({ org }: { org: string }) {
  const map: Record<string, string> = {
    programming: 'badge-programming',
    english: 'badge-english',
    osis: 'badge-osis',
    mpk: 'badge-mpk',
  }
  return (
    <span className={`badge ${map[org] || 'badge'}`}>
      {ORG_LABELS[org as OrgType] || org}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    hadir: 'badge-hadir',
    tidak_hadir: 'badge-tidak_hadir',
    izin: 'badge-izin',
    sakit: 'badge-sakit',
  }
  return (
    <span className={`badge ${map[status] || 'badge'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    administrator: 'bg-amber-50 text-amber-700 border border-amber-200',
    admin_programming: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    admin_english: 'bg-blue-50 text-blue-700 border border-blue-200',
    admin_osis_mpk: 'bg-violet-50 text-violet-700 border border-violet-200',
  }
  const labels: Record<string, string> = {
    administrator: 'Administrator',
    admin_programming: 'Admin Programming',
    admin_english: 'Admin English Club',
    admin_osis_mpk: 'Admin OSIS & MPK',
  }
  return (
    <span className={`badge ${map[role] || 'badge'}`}>
      {labels[role] || role}
    </span>
  )
}
