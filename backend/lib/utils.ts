import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export const formatDate = (date: string | Date | null | undefined, formatStr: string = 'd MMMM yyyy') => {
  if (!date) return '-'
  return format(new Date(date), formatStr, { locale: id })
}

export const formatDateTime = (date: string | Date | null | undefined, formatStr: string = 'd MMMM yyyy HH:mm') => {
  if (!date) return '-'
  return format(new Date(date), formatStr, { locale: id })
}

export type OrgType = 'programming' | 'english' | 'osis' | 'mpk'

export const ORG_LABELS: Record<OrgType, string> = {
  programming: 'Programming',
  english: 'English Club',
  osis: 'OSIS',
  mpk: 'MPK'
}

export const STATUS_LABELS: Record<string, string> = {
  hadir: 'Hadir',
  tidak_hadir: 'Tidak Hadir',
  izin: 'Izin',
  sakit: 'Sakit'
}
