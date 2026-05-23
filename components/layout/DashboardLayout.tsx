'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Topbar from '@/components/layout/Topbar'

const Sidebar = dynamic(() => import('@/components/layout/Sidebar'), {
  ssr: false,
  loading: () => (
    <aside className="hidden lg:flex flex-col bg-[#011025] border-r border-[#5482B4]/15 h-screen sticky top-0 shadow-sm w-60" />
  )
})

interface DashboardLayoutProps {
  user: { id: number; nama: string; email: string; role: string }
  pageTitle: string
  children: React.ReactNode
}

export default function DashboardLayout({ user, pageTitle, children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const themeClass = user.role === 'administrator' ? 'theme-admin' : ''

  return (
    <div className={`flex h-screen overflow-hidden bg-[#F4F8FC] ${themeClass}`}>
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
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
