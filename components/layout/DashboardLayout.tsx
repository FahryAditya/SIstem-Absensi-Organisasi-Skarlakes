'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Topbar from '@/components/layout/Topbar'

const Sidebar = dynamic(() => import('@/components/layout/Sidebar'), {
  ssr: false,
  loading: () => (
    <aside className="hidden lg:flex flex-col bg-slate-900 border-r border-slate-800 h-screen sticky top-0 shadow-sm w-60" />
  )
})

interface DashboardLayoutProps {
  user: { 
    id: number; 
    nama: string; 
    email: string; 
    role: string;
    activeOrgId?: number;
    orgIds: number[];
  }
  pageTitle: string
  children: React.ReactNode
}

export default function DashboardLayout({ user, pageTitle, children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const themeClass = user.role === 'SUPER_ADMIN' ? 'theme-admin' : ''

  return (
    <div className={`flex h-[100dvh] overflow-hidden bg-white/5 ${themeClass}`}>
      <Sidebar 
        user={user} 
        mobileOpen={mobileOpen} 
        onClose={() => setMobileOpen(false)} 
        isCollapsed={isCollapsed} 
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar 
          user={user} 
          pageTitle={pageTitle} 
          onMenuClick={() => setMobileOpen(true)} 
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
        <main className="mobile-scroll flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
