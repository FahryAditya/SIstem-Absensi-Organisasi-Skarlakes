import { clsx, type ClassValue } from 'clsx'
import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(date: string | Date, fmt = 'dd MMM yyyy') {
  const d = typeof date === 'string' ? (date.includes('T') ? parseISO(date) : new Date(date + 'T00:00:00')) : date
  return format(d, fmt, { locale: id })
}

export function formatDateTime(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd MMM yyyy, HH:mm', { locale: id })
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export type OrgType = 'programming' | 'english' | 'osis' | 'mpk'

export const ORG_LABELS: Record<OrgType, string> = {
  programming: 'Programming',
  english: 'English Club',
  osis: 'OSIS',
  mpk: 'MPK',
}

export const ORG_COLORS: Record<OrgType, { bg: string; text: string; border: string; dot: string }> = {
  programming: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  english:     { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500' },
  osis:        { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  dot: 'bg-violet-500' },
  mpk:         { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  dot: 'bg-orange-500' },
}

export const STATUS_LABELS: Record<string, string> = {
  hadir: 'Hadir',
  tidak_hadir: 'Tidak Hadir',
  izin: 'Izin',
  sakit: 'Sakit',
}

export const STATUS_COLORS: Record<string, string> = {
  hadir:       'bg-green-50 text-green-700 border border-green-200',
  tidak_hadir: 'bg-red-50 text-red-600 border border-red-200',
  izin:        'bg-yellow-50 text-yellow-700 border border-yellow-200',
  sakit:       'bg-blue-50 text-blue-600 border border-blue-200',
}

export const ROLE_COLORS: Record<string, string> = {
  administrator:    'bg-amber-50 text-amber-700 border border-amber-200',
  admin_programming:'bg-emerald-50 text-emerald-700 border border-emerald-200',
  admin_english:    'bg-blue-50 text-blue-700 border border-blue-200',
  admin_osis_mpk:   'bg-violet-50 text-violet-700 border border-violet-200',
}
