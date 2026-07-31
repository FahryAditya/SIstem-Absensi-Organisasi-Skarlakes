'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ROLE_LABELS, isAdministrator } from '@/lib/auth-shared'
import Image from 'next/image'
import {
  LayoutDashboard, Users, ClipboardList, Building2, UserCog, Mail,
  Download, GraduationCap, X, Wallet, HandCoins, Database, ScrollText, Megaphone,
  Trophy, BookOpen, CalendarDays, ClipboardCheck, Zap, Mic
} from 'lucide-react'
import AnimatedList from '../AnimatedList'

interface SidebarProps {
  user: { id: number; nama: string; email: string; role: string; activeOrgId?: number; orgIds: number[] }
  mobileOpen?: boolean
  onClose?: () => void
  isCollapsed?: boolean
}

type SidebarItem = 
  | { type: 'logo'; label: string; version: string }
  | { type: 'badge'; role: string }
  | { type: 'section'; label: string }
  | { type: 'link'; label: string; href: string; icon: any; status?: string; target?: string }

function getFlattenedNavItems(role: string, isCollapsed: boolean): SidebarItem[] {
  const items: SidebarItem[] = []
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || 'Pro Series'
  
  items.push({ type: 'logo', label: 'Sistem Ekstrakurikuler', version: `V ${appVersion}` })
  
  if (!isCollapsed) {
    items.push({ type: 'badge', role })
  }

  items.push({ type: 'section', label: 'Dashboard' })
  items.push({ type: 'link', href: '/dashboard', label: 'Ringkasan Utama', icon: LayoutDashboard })
  items.push({ type: 'link', href: '/leaderboard', label: 'Leaderboard', icon: Trophy })

  items.push({ type: 'section', label: 'Kegiatan' })
  items.push({ type: 'link', href: '/materi', label: 'Materi Hari Ini', icon: BookOpen })
  items.push({ type: 'link', href: '/jadwal', label: 'Jadwal Kegiatan', icon: CalendarDays })
  items.push({ type: 'link', href: '/absensi', label: 'Absensi & Kas', icon: ClipboardList })
  items.push({ type: 'link', href: '/rekap-absensi', label: 'Rekap Absensi', icon: ClipboardCheck })
  items.push({ type: 'link', href: '/kas', label: 'Buku Kas', icon: Wallet })
  items.push({ type: 'link', href: '/pengeluaran', label: 'Pengeluaran Kas', icon: HandCoins })

  items.push({ type: 'section', label: 'Manajemen Anggota' })
  items.push({ type: 'link', href: '/siswa', label: 'Daftar Anggota', icon: Users })
  items.push({ type: 'link', href: '/registration', label: 'Pendaftaran', icon: ClipboardList })

  // Wawancara OSIS & MPK - hanya untuk role yang punya akses
  if (role === 'SUPER_ADMIN' || isAdministrator(role) || role === 'admin_osis_mpk') {
    items.push({ type: 'link', href: '/wawancara', label: 'Wawancara OSIS & MPK', icon: Mic })
  }

  items.push({ type: 'section', label: 'Tools' })
  items.push({ type: 'link', href: '/admin/email', label: 'Kirim Pengumuman', icon: Mail })
  items.push({ type: 'link', href: '/admin/exp', label: 'Kelola XP', icon: Zap })
  items.push({ type: 'link', href: '/import', label: 'Import Data', icon: Download })
  items.push({ type: 'link', href: '/export', label: 'Export Data', icon: Download })
  
  if (role === 'SUPER_ADMIN' || isAdministrator(role)) {
    items.push({ type: 'section', label: 'Administrator Utama' })
    items.push({ type: 'link', href: '/admin/organizations', label: 'Manajemen Organisasi', icon: Building2 })
    items.push({ type: 'link', href: '/admin', label: 'Manajemen User', icon: UserCog })
    items.push({ type: 'link', href: '/update-sistem', label: 'Update Sistem', icon: Megaphone })
    items.push({ type: 'link', href: '/log', label: 'Log Aktivitas', icon: ScrollText })
    items.push({ type: 'link', href: '/api/admin/backup', label: 'Backup Database', icon: Database, target: '_blank' })
  }

  return items
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    SUPER_ADMIN: 'bg-yellow-bright-400 border-yellow-bright-400 text-royal-900 font-extrabold',
    ORG_ADMIN: 'bg-yellow-bright-100 border-yellow-bright-300 text-yellow-bright-800 font-extrabold',
  }
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold ${colors[role] || 'bg-cream-100 border-royal-200 text-royal-800'}`}>
      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {ROLE_LABELS[role] || role}
    </div>
  )
}

export default function Sidebar({ user, mobileOpen, onClose, isCollapsed }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const role = user.role as string

  const navItems = getFlattenedNavItems(role, !!isCollapsed)
  const routeKey = searchParams.size > 0 ? `${pathname}?${searchParams.toString()}` : pathname

  const isActive = (href: string) => {
    const base = href.split('?')[0]
    return pathname.startsWith(base)
  }

  const renderSidebarItem = (item: SidebarItem, index: number) => {
    switch (item.type) {
      case 'logo':
        return (
          <div className="px-1 py-4 flex items-center justify-between border-b border-royal-200 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-yellow-bright-400 rounded-xl flex items-center justify-center shadow-sm shadow-yellow-bright-400/30 flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-royal-900" />
              </div>
              {!isCollapsed && (
                <div className="fade-in whitespace-nowrap">
                  <div className="text-sm font-black text-royal-900 tracking-tight">{item.label}</div>
                  <div className="text-[10px] text-royal-500 font-medium">{item.version}</div>
                </div>
              )}
            </div>
            {onClose && (
              <button onClick={onClose} className="lg:hidden btn-icon" aria-label="Tutup menu navigasi">
                <X className="w-4 h-4 text-royal-400" />
              </button>
            )}
          </div>
        )
      case 'badge':
        return (
          <div className="px-1 py-2 mb-2">
            <RoleBadge role={item.role} />
          </div>
        )
      case 'section':
        return !isCollapsed ? (
          <div className="px-3 pt-4 pb-2 text-[10px] font-black text-royal-400 uppercase tracking-wider">
            {item.label}
          </div>
        ) : <div className="h-4" />
      case 'link':
        const Icon = item.icon
        const isNonaktif = item.status === 'nonaktif'
        const active = !isNonaktif && isActive(item.href)
        return (
          <Link
            href={item.href}
            prefetch={false}
            onClick={(e) => {
              if (isNonaktif) {
                e.preventDefault()
              } else if (onClose) {
                onClose()
              }
            }}
            target={item.target}
            className={cn(
              'group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-out',
              active 
                ? 'bg-cream-100 text-royal-900 font-semibold border-l-4 border-yellow-bright-400' 
                : 'text-royal-500 hover:text-royal-900 hover:bg-cream-100 hover:translate-x-1',
              isNonaktif && 'opacity-60 cursor-not-allowed'
            )}
          >
            <Icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", active ? "text-yellow-bright-400" : "text-royal-400 group-hover:text-royal-800")} />
            {!isCollapsed && (
              <span className={cn("flex-1 truncate text-[13px]", active ? "font-semibold" : "font-medium text-royal-800")}>
                {item.label}
              </span>
            )}
            {!isCollapsed && active && <div className="w-1.5 h-1.5 rounded-full bg-yellow-bright-400" />}
          </Link>
        )
    }
  }

  const content = (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <AnimatedList
          items={navItems}
          renderItem={renderSidebarItem}
          className="h-full"
          listClassName="px-3"
          showGradients={true}
          enableArrowNavigation={true}
          resetScrollKey={routeKey}
        />
      </div>

       <div className="px-4 py-4 border-t border-royal-200 flex-shrink-0 bg-white">
        <div className="flex items-center gap-2.5">
          {role === 'SUPER_ADMIN' || isAdministrator(role) ? (
            <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-sm border border-royal-200 flex-shrink-0">
              <Image 
                src="https://uploads.onecompiler.io/43k3cj6jv/44n5t3sn5/WhatsApp%20Image%202026-05-03%20at%2011.12.38.jpeg" 
                alt="Admin Profile" 
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-yellow-bright-400 flex items-center justify-center text-royal-900 text-xs font-black flex-shrink-0">
              {user.nama.charAt(0).toUpperCase()}
            </div>
          )}
          {!isCollapsed && (
            <div className="min-w-0 flex-1 fade-in">
              <div className="text-xs font-bold text-royal-900 truncate">{user.nama}</div>
              <div className="text-[10px] text-royal-400 truncate">{user.email}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <aside className={cn(
        "hidden lg:flex flex-col bg-white border-r border-royal-200 h-screen sticky top-0 shadow-sm transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-60"
      )}>
        {content}
      </aside>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-royal-900/50 backdrop-blur-sm" onClick={onClose} />
          <aside className="relative w-64 bg-white h-full shadow-2xl slide-up">
            {content}
          </aside>
        </div>
      )}
    </>
  )
}
