'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/auth-shared'
import Image from 'next/image'
import {
  LayoutDashboard, Users, ClipboardList, Building2, UserCog,
  Download, ScrollText, GraduationCap, X, ChevronRight, Wallet, HandCoins, Database, MessagesSquare, QrCode, UserX
} from 'lucide-react'

interface SidebarProps {
  user: { id: number; nama: string; email: string; role: string }
  mobileOpen?: boolean
  onClose?: () => void
}

function getNavItems(role: string) {
  const items = [
    { section: 'Utama', links: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/kas', label: 'Buku Kas', icon: Wallet },
      { href: '/pengeluaran', label: 'Pengeluaran Kas', icon: HandCoins },
    ]},
  ]

  const ekskulLinks = []
  const orgLinks = []

  if (role === 'administrator' || role === 'admin_programming' || role === 'admin_english') {
    if (role === 'administrator' || role === 'admin_programming') {
      ekskulLinks.push({ href: '/siswa?org=programming', label: 'Siswa Programming', icon: Users })
      ekskulLinks.push({ href: '/absensi?org=programming', label: 'Absensi Programming', icon: ClipboardList })
    }
    if (role === 'administrator' || role === 'admin_english') {
      ekskulLinks.push({ href: '/siswa?org=english', label: 'Siswa English', icon: Users })
      ekskulLinks.push({ href: '/absensi?org=english', label: 'Absensi English', icon: ClipboardList })
    }
    items.push({ section: 'Ekstrakurikuler', links: ekskulLinks })
  }

  if (role === 'administrator' || role === 'admin_osis_mpk') {
    orgLinks.push({ href: '/organisasi?org=osis', label: 'OSIS', icon: Building2 })
    orgLinks.push({ href: '/organisasi?org=mpk', label: 'MPK', icon: Building2 })
    
    orgLinks.push({ 
      href: '/wawancara',
      label: 'Wawancara OSIS & MPK', 
      icon: MessagesSquare,
    } as any)
    
    items.push({ section: 'Organisasi', links: orgLinks })
  }

const toolLinks = [
     { href: '/import', label: 'Import Excel', icon: Download },
     { href: '/export', label: 'Export Data', icon: Download },
   ]

   if (role === 'administrator') {
     toolLinks.unshift({ href: '/admin', label: 'Kelola User', icon: UserCog })
     toolLinks.push({ href: '/qr-code', label: 'QR Code Wawancara', icon: QrCode })
     toolLinks.push({ href: '/hapus-peserta', label: 'Hapus Peserta Wawancara', icon: UserX })
     toolLinks.push({ href: '/log', label: 'Log Aktivitas', icon: ScrollText })
     toolLinks.push({ href: '/api/admin/backup', label: 'Backup SQL', icon: Database, target: '_blank' } as any)
   }

  items.push({ section: 'Tools', links: toolLinks })
  return items
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    administrator: 'bg-[#052659] border-[#5482B4]/30 text-white',
    admin_programming: 'bg-[rgba(84,130,180,0.12)] border-[#5482B4]/25 text-[#C2E8FF]',
    admin_english: 'bg-[rgba(84,130,180,0.12)] border-[#5482B4]/25 text-[#C2E8FF]',
    admin_osis_mpk: 'bg-[rgba(84,130,180,0.12)] border-[#5482B4]/25 text-[#C2E8FF]',
  }
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold ${colors[role] || 'bg-[rgba(84,130,180,0.12)] border-[#5482B4]/25 text-[#C2E8FF]'}`}>
      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {ROLE_LABELS[role] || role}
    </div>
  )
}

export default function Sidebar({ user, mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const navItems = getNavItems(user.role)

  const isActive = (href: string) => {
    const base = href.split('?')[0]
    return pathname.startsWith(base)
  }

  const content = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[#5482B4]/15 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#052659] rounded-xl flex items-center justify-center shadow-sm shadow-[#052659]/30">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-black text-white tracking-tight">Sistem Ekstrakurikuler Sekolah</div>
            <div className="text-[10px] text-white/50 font-medium">V 17.5.1</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden btn-icon">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Role badge */}
      <div className="px-4 py-3 border-b border-[#5482B4]/15 flex-shrink-0">
        <RoleBadge role={user.role} />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {navItems.map(section => (
          <div key={section.section} className="mb-1">
            <div className="nav-section">{section.section}</div>
            {section.links.map(link => {
              const Icon = link.icon
              const isNonaktif = (link as any).status === 'nonaktif'
              const active = !isNonaktif && isActive(link.href)
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    if (isNonaktif) {
                      e.preventDefault()
                    } else if (onClose) {
                      onClose()
                    }
                  }}
                  target={(link as any).target}
                  className={cn(
                    'nav-link', 
                    active && 'nav-link-active',
                    isNonaktif && 'opacity-60 cursor-not-allowed hover:bg-transparent'
                  )}
                >
                  <Icon className={cn("w-4 h-4 flex-shrink-0", isNonaktif && "text-red-500")} />
                  <span className={cn("flex-1 truncate text-[13px]", isNonaktif && "text-red-500 font-medium")}>{link.label}</span>
                  {isNonaktif && <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">NONAKTIF</span>}
                  {active && <ChevronRight className="w-3 h-3 opacity-40" />}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t border-[#5482B4]/15 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          {user.role === 'administrator' ? (
            <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-sm border border-[#5482B4]/30">
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
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">{user.nama}</div>
            <div className="text-[10px] text-white/50 truncate">{user.email}</div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:flex flex-col w-60 bg-[#011025] border-r border-[#5482B4]/15 h-screen sticky top-0 shadow-sm">
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
