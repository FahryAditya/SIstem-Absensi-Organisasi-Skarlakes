'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Menu, LogOut, ChevronDown, Loader2, Contact } from 'lucide-react'
import { ROLE_LABELS } from '@/lib/auth-shared'

interface TopbarProps {
  user: { id: number; nama: string; email: string; role: string }
  pageTitle: string
  onMenuClick: () => void
}

export default function Topbar({ user, pageTitle, onMenuClick }: TopbarProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    sessionStorage.removeItem('welcome_shown')
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.success('Berhasil logout')
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 h-14 flex items-center px-4 lg:px-6 gap-4">
      <button onClick={onMenuClick} className="lg:hidden btn-icon">
        <Menu className="w-5 h-5" />
      </button>

      <h1 className="flex-1 text-sm font-bold text-slate-800 truncate">{pageTitle}</h1>

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          {user.role === 'administrator' ? (
            <img src="https://uploads.onecompiler.io/43k3cj6jv/44n5t3sn5/WhatsApp%20Image%202026-05-03%20at%2011.12.38.jpeg" alt="Profile" className="w-7 h-7 rounded-full object-cover shadow-sm border border-slate-200" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-black">
              {user.nama.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight">{user.nama}</div>
            <div className="text-[10px] text-slate-400">{ROLE_LABELS[user.role] || user.role}</div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 fade-in">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <Contact className="w-4 h-4 text-slate-400" />
                  <div className="text-sm font-bold text-slate-800">{user.nama}</div>
                </div>
                <div className="text-xs text-slate-500">{user.email}</div>
                <div className="text-[11px] font-semibold text-indigo-600 mt-1">{ROLE_LABELS[user.role]}</div>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors mt-0.5 font-medium"
              >
                {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                {loggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
