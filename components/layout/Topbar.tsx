'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { Menu, LogOut, ChevronDown, Loader2, Contact, Settings } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/auth-shared';
import StaggeredMenu from '@/components/StaggeredMenu';

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
  const [toolsOpen, setToolsOpen] = useState(false); // tools menu
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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[rgba(84,130,180,0.15)] h-14 flex items-center px-4 lg:px-6 gap-4">
      <button onClick={onMenuClick} className="lg:hidden btn-icon">
        <Menu className="w-5 h-5" />
      </button>

      <button onClick={onToggleCollapse} className="hidden lg:flex btn-icon hover:bg-slate-100 transition-colors">
        <Menu className="w-5 h-5 text-slate-600" />
      </button>

      <h1 className="flex-1 text-sm font-bold text-[#011025] truncate">{pageTitle}</h1>

      <button onClick={() => setToolsOpen(true)} className="btn-icon hidden sm:inline-flex" aria-label="Tools">
        <Settings className="w-5 h-5 text-slate-600" />
      </button>

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[rgba(126,160,197,0.15)] transition-colors"
        >
          {user.role === 'administrator' ? (
            <div className="relative w-7 h-7 rounded-full overflow-hidden shadow-sm border border-[rgba(84,130,180,0.15)]">
              <Image
                src="https://uploads.onecompiler.io/43k3cj6jv/44n5t3sn5/WhatsApp%20Image%202026-05-03%20at%2011.12.38.jpeg"
                alt="Profile"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#052659] flex items-center justify-center text-white text-xs font-black">
              {user.nama.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-[#011025] leading-tight">{user.nama}</div>
            <div className="text-[10px] text-[#7EA0C5]">{ROLE_LABELS[user.role] || user.role}</div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[#7EA0C5]" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-[rgba(84,130,180,0.15)] py-1.5 z-50 fade-in">
              <div className="px-4 py-3 border-b border-[rgba(84,130,180,0.15)]">
                <div className="flex items-center gap-2 mb-1">
                  <Contact className="w-4 h-4 text-[#5482B4]" />
                  <div className="text-sm font-bold text-[#011025]">{user.nama}</div>
                </div>
                <div className="text-xs text-[#7EA0C5]">{user.email}</div>
                <div className="text-[11px] font-semibold text-[#052659] mt-1">{ROLE_LABELS[user.role]}</div>
              </div>
            </div>
          </>
        )}
      </div>

      {toolsOpen && (
        <>
          <StaggeredMenu
            isFixed
            position="right"
            items={[
              { label: 'Presentasi File', ariaLabel: 'Presentasi File', link: '#presentasi' },
              { label: 'Client', ariaLabel: 'Client', link: '#client' },
              { label: 'Dokumentasi', ariaLabel: 'Dokumentasi', link: '#dokumentasi' },
              ...(user.role === 'administrator'
                ? [{ label: 'Logout', ariaLabel: 'Logout', link: '#logout' }]
                : []),
            ]}
            onMenuClose={() => setToolsOpen(false)}
          />
          {user.role === 'administrator' && (
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="ml-2 btn-icon"
            >
              {loggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
            </button>
          )}
        </>
      )}
    </header>
  );
}
