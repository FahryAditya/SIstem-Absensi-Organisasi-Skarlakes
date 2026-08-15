'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Topbar from '@/components/layout/Topbar'
import toast from 'react-hot-toast'

const Sidebar = dynamic(() => import('@/components/layout/Sidebar'), {
  ssr: false,
  loading: () => (
    <aside className="hidden lg:flex flex-col bg-white border-r border-royal-200 h-screen sticky top-0 shadow-sm w-60" />
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
  const themeClass = (user.role === 'SUPER_ADMIN' || (user.role as string) === 'administrator') ? 'theme-admin' : ''

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.status === 401) {
          toast.error('Sesi Anda telah berakhir. Silakan login kembali.')
          sessionStorage.removeItem('welcome_shown')
          await fetch('/api/auth/logout', { method: 'POST' })
          window.location.href = '/login'
        }
      } catch (err) {
        console.error('Session check failed:', err)
      }
    }

    const interval = setInterval(checkSession, 5 * 60 * 1000) // Check every 5 minutes
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-cream-50">
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
