'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { Menu, LogOut, ChevronDown, Loader2, Contact } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/auth-shared';

interface TopbarProps {
  user: { id: number; nama: string; email: string; role: string };
  pageTitle: string;
  onMenuClick: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Topbar({
  user,
  pageTitle,
  onMenuClick,
  isCollapsed,
  onToggleCollapse,
}: TopbarProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false); // profile dropdown
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    sessionStorage.removeItem('welcome_shown');
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('Berhasil logout');
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 shrink-0 bg-deep-navy border-b border-white/10 h-14 flex items-center px-4 lg:px-6 gap-4">
      <button onClick={onMenuClick} className="lg:hidden btn-icon">
        <Menu className="w-5 h-5 text-white" />
      </button>

      <button onClick={onToggleCollapse} className="hidden lg:flex btn-icon hover:bg-white/10 transition-colors">
        <Menu className="w-5 h-5 text-white" />
      </button>

      <h1 className="flex-1 text-sm font-bold text-white truncate">{pageTitle}</h1>

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          {user.role === 'administrator' ? (
            <div className="relative w-7 h-7 rounded-full overflow-hidden shadow-sm border border-white/10">
              <Image
                src="https://uploads.onecompiler.io/43k3cj6jv/44n5t3sn5/WhatsApp%20Image%202026-05-03%20at%2011.12.38.jpeg"
                alt="Profile"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-persian-blue flex items-center justify-center text-white text-xs font-black">
              {user.nama.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-white leading-tight">{user.nama}</div>
            <div className="text-[10px] text-slate-400">{ROLE_LABELS[user.role] || user.role}</div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-64 bg-deep-navy/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-white/10 py-2 z-50 select-dropdown-enter">
              <div className="px-4 py-3 border-b border-white/5 mb-1">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <Contact className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-sm font-black text-white">{user.nama}</div>
                </div>
                <div className="text-xs text-slate-400">{user.email}</div>
                <div className="text-[11px] font-semibold text-persian-blue mt-1">{ROLE_LABELS[user.role]}</div>
              </div>
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-white/5 rounded-xl transition-all duration-200"
                >
                  <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                    {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  </div>
                  {loggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
