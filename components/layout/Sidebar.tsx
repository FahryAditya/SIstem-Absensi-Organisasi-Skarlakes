'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/auth-shared'
import Image from 'next/image'
import {
  LayoutDashboard, Users, ClipboardList, Building2, UserCog,
  Download, ScrollText, GraduationCap, X, ChevronRight, Wallet, HandCoins, Database, MessagesSquare, QrCode, UserX, Megaphone, BarChart3, Camera,
  Trophy, Star, BookOpen, CalendarDays, ClipboardCheck, Zap
} from 'lucide-react'
import AnimatedList from '../AnimatedList'

interface SidebarProps {
  user: { id: number; nama: string; email: string; role: string }
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
  
  items.push({ type: 'logo', label: 'Sistem Ekstrakurikuler', version: 'V 18.5.5 Artemis Series ( Stable ) ' })
  
  if (!isCollapsed) {
    items.push({ type: 'badge', role })
  }

  items.push({ type: 'section', label: 'Dashboard' })
  items.push({ type: 'link', href: '/dashboard', label: 'Ringkasan Utama', icon: LayoutDashboard })
  items.push({ type: 'link', href: '/leaderboard', label: 'Leaderboard', icon: Trophy })
  items.push({ type: 'link', href: '/pencapaian', label: 'Pencapaian', icon: Star })

  items.push({ type: 'section', label: 'Kegiatan' })
  items.push({ type: 'link', href: '/materi', label: role === 'admin_osis_mpk' ? 'Jadwal Rapat' : 'Materi Hari Ini', icon: BookOpen })
  items.push({ type: 'link', href: '/jadwal', label: role === 'admin_osis_mpk' ? 'Pembawa Materi' : 'Jadwal Pengajar', icon: CalendarDays })
  items.push({ type: 'link', href: '/laporan', label: 'Laporan Statistik', icon: BarChart3 })
  items.push({ type: 'link', href: '/rekap-absensi', label: 'Rekap Absensi', icon: ClipboardCheck })
  items.push({ type: 'link', href: '/kas', label: 'Buku Kas', icon: Wallet })
  items.push({ type: 'link', href: '/pengeluaran', label: 'Pengeluaran Kas', icon: HandCoins })

  if (role === 'administrator' || role === 'admin_programming' || role === 'admin_english') {
    items.push({ type: 'section', label: 'Ekstrakurikuler' })
    if (role === 'administrator' || role === 'admin_programming') {
      items.push({ type: 'link', href: '/siswa?org=programming', label: 'Siswa Programming', icon: Users })
      items.push({ type: 'link', href: '/absensi?org=programming', label: 'Absensi Programming', icon: ClipboardList })
    }
    if (role === 'administrator' || role === 'admin_english') {
      items.push({ type: 'link', href: '/siswa?org=english', label: 'Siswa English', icon: Users })
      items.push({ type: 'link', href: '/absensi?org=english', label: 'Absensi English', icon: ClipboardList })
    }
  }

  if (role === 'administrator' || role === 'admin_osis_mpk') {
    items.push({ type: 'section', label: 'Organisasi' })
    items.push({ type: 'link', href: '/organisasi?org=osis', label: 'OSIS', icon: Building2 })
    items.push({ type: 'link', href: '/organisasi?org=mpk', label: 'MPK', icon: Building2 })
    items.push({ type: 'link', href: '/wawancara', label: 'Wawancara OSIS & MPK', icon: MessagesSquare })
  }

  items.push({ type: 'section', label: 'Tools' })
  items.push({ type: 'link', href: '/admin/exp', label: 'Kelola EXP', icon: Zap })
  if (role === 'administrator') {
    items.push({ type: 'link', href: '/admin', label: 'Kelola User', icon: UserCog })
  }
  items.push({ type: 'link', href: '/import', label: 'Import Excel', icon: Download })
  items.push({ type: 'link', href: '/export', label: 'Export Data', icon: Download })
  items.push({ type: 'link', href: '/ambil-siswa', label: 'Ambil Siswa', icon: ScrollText })
  
  if (role === 'administrator') {
    items.push({ type: 'link', href: '/update-sistem', label: 'Update Sistem', icon: Megaphone })
    items.push({ type: 'link', href: '/qr-code', label: 'QR Code Wawancara', icon: QrCode })
    items.push({ type: 'link', href: '/hapus-peserta', label: 'Hapus Peserta Wawancara', icon: UserX })
    items.push({ type: 'link', href: '/log', label: 'Log Aktivitas', icon: ScrollText })
    items.push({ type: 'link', href: '/api/admin/backup', label: 'Backup SQL', icon: Database, target: '_blank' })
  }

  return items
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    administrator: 'bg-[#052659] border-[#5482B4]/30 text-white font-extrabold',
    admin_programming: 'bg-[rgba(84,130,180,0.12)] border-[#5482B4]/25 text-white font-extrabold',
    admin_english: 'bg-[rgba(84,130,180,0.12)] border-[#5482B4]/25 text-white font-extrabold',
    admin_osis_mpk: 'bg-[rgba(84,130,180,0.12)] border-[#5482B4]/25 text-white font-extrabold',
  }
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold ${colors[role] || 'bg-[rgba(84,130,180,0.12)] border-[#5482B4]/25 text-[#C2E8FF]'}`}>
      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {ROLE_LABELS[role] || role}
    </div>
  )
}

export default function Sidebar({ user, mobileOpen, onClose, isCollapsed }: SidebarProps) {
  const pathname = usePathname()
  const cleanRole = (user.role || '').trim().toLowerCase()
  const navItems = getFlattenedNavItems(cleanRole, !!isCollapsed)

  const isActive = (href: string) => {
    const base = href.split('?')[0]
    return pathname.startsWith(base)
  }

  const renderSidebarItem = (item: SidebarItem, index: number) => {
    switch (item.type) {
      case 'logo':
        return (
          <div className="px-1 py-4 flex items-center justify-between border-b border-[#5482B4]/15 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#052659] rounded-xl flex items-center justify-center shadow-sm shadow-[#052659]/30 flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <div className="fade-in whitespace-nowrap">
                  <div className="text-sm font-black text-white tracking-tight">{item.label}</div>
                  <div className="text-[10px] text-white font-medium">{item.version}</div>
                </div>
              )}
            </div>
            {onClose && (
              <button onClick={onClose} className="lg:hidden btn-icon" aria-label="Tutup menu navigasi">
                <X className="w-4 h-4 text-white/50" />
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
          <div className="px-3 pt-4 pb-2 text-[10px] font-black text-white uppercase tracking-wider">
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
                ? 'bg-gradient-to-r from-[#5482B4]/20 to-transparent text-white border-l-4 border-[#5482B4] font-bold shadow-[0_4px_20px_-5px_rgba(84,130,180,0.3)]' 
                : 'text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-1',
              isNonaktif && 'opacity-60 cursor-not-allowed'
            )}
          >
            <Icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", active ? "text-[#C2E8FF]" : "text-slate-500 group-hover:text-white")} />
            {!isCollapsed && (
              <span className={cn("flex-1 truncate text-[13px]", active ? "font-semibold text-white" : "font-medium text-white")}>
                {item.label}
              </span>
            )}
            {!isCollapsed && active && <div className="w-1.5 h-1.5 rounded-full bg-[#5482B4] shadow-[0_0_8px_#5482B4]" />}
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
        />
      </div>

       <div className="px-4 py-4 border-t border-[#5482B4]/15 flex-shrink-0 bg-[#011025]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          {cleanRole === 'administrator' ? (
            <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-sm border border-[#5482B4]/30 flex-shrink-0">
              <Image 
                src="https://uploads.onecompiler.io/43k3cj6jv/44n5t3sn5/WhatsApp%20Image%202026-05-03%20at%2011.12.38.jpeg" 
                alt="Admin Profile" 
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#052659] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
              {user.nama.charAt(0).toUpperCase()}
            </div>
          )}
          {!isCollapsed && (
            <div className="min-w-0 flex-1 fade-in">
              <div className="text-xs font-bold text-white truncate">{user.nama}</div>
              <div className="text-[10px] text-white/50 truncate">{user.email}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <aside className={cn(
        "hidden lg:flex flex-col bg-[#011025] border-r border-[#5482B4]/15 h-screen sticky top-0 shadow-sm transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-60"
      )}>
        {content}
      </aside>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <aside className="relative w-64 bg-[#011025] h-full shadow-2xl slide-up">
            {content}
          </aside>
        </div>
      )}
    </>
  )
}
