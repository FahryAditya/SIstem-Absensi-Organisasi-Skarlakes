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
    administrator: 'bg-persian-blue/10 text-persian-blue border border-persian-blue/20',
    admin_programming: 'bg-unit-programming/10 text-unit-programming border border-unit-programming/20',
    admin_english: 'bg-unit-english/10 text-blue-400 border border-unit-english/20',
    admin_osis_mpk: 'bg-unit-osis/10 text-unit-osis border border-unit-osis/20',
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
