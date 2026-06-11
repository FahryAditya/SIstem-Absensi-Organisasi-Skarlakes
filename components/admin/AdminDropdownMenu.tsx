'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { 
  ChevronDown, Mail, Plus, UserCheck, Link as LinkIcon, Cpu, Database, Trash2, ArrowUpRight,
  Building2, Users, CalendarCheck, Wallet, Trophy, ShieldCheck
} from 'lucide-react';

interface AdminDropdownMenuProps {
  onOpenEmailSetting: () => void;
  onOpenAddUser: () => void;
  onOptimizeDb: () => void;
  onOpenCleanupWawancara: () => void;
  userRole: string;
}

const AdminDropdownMenu: React.FC<AdminDropdownMenuProps> = ({
  onOpenEmailSetting,
  onOpenAddUser,
  onOptimizeDb,
  onOpenCleanupWawancara,
  userRole
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const calculateHeight = () => {
    const menuEl = menuRef.current;
    if (!menuEl) return 0;
    
    // Temporarily set height to auto to get the scrollHeight
    const prevHeight = menuEl.style.height;
    const prevVisibility = menuEl.style.visibility;
    const prevPosition = menuEl.style.position;
    
    menuEl.style.height = 'auto';
    menuEl.style.visibility = 'visible';
    menuEl.style.position = 'absolute';
    
    const height = menuEl.scrollHeight;
    
    // Restore previous values
    menuEl.style.height = prevHeight;
    menuEl.style.visibility = prevVisibility;
    menuEl.style.position = prevPosition;
    
    return height;
  };

  const createTimeline = () => {
    const menuEl = menuRef.current;
    if (!menuEl) return null;

    // Set initial GSAP states
    gsap.set(menuEl, { height: 0, opacity: 0, overflow: 'hidden' });
    gsap.set(cardsRef.current, { y: 25, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(menuEl, {
      height: calculateHeight,
      opacity: 1,
      duration: 0.35,
      ease: 'power3.out'
    });

    tl.to(
      cardsRef.current,
      {
        y: 0,
        opacity: 1,
        duration: 0.35,
        stagger: 0.08,
        ease: 'power3.out'
      },
      '-=0.15'
    );

    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;

    return () => {
      tl?.kill();
      tlRef.current = null;
    };
  }, []);

  // Update layout when window resizes
  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;
      if (isOpen) {
        const newHeight = calculateHeight();
        gsap.set(menuRef.current, { height: newHeight });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;

    if (!isOpen) {
      setIsOpen(true);
      tl.play(0);
    } else {
      tl.eventCallback('onReverseComplete', () => {
        setIsOpen(false);
      });
      tl.reverse();
    }
  };

  // Close when clicking outside
  React.useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        toggleMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    if (el) cardsRef.current[i] = el;
  };

  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    toggleMenu();
    setTimeout(() => {
      window.location.href = href;
    }, 300);
  };

  const handleActionClick = (action: () => void) => {
    toggleMenu();
    setTimeout(() => {
      action();
    }, 300);
  };

  return (
    <div ref={containerRef} className="relative z-40">
      {/* Trigger Button */}
      <button
        onClick={toggleMenu}
        className={`btn-secondary flex items-center gap-2 font-bold px-4 py-2 border transition-all duration-300 ${
          isOpen 
            ? 'bg-[#1E90FF]/20 border-[#1E90FF]/50 text-white shadow-[0_0_15px_rgba(30,144,255,0.2)]' 
            : 'text-persian-blue border-white/10 hover:border-[#1E90FF]/30'
        }`}
      >
        <span>Menu Pengelola</span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : 'text-persian-blue'}`} 
        />
      </button>

      {/* Animated Dropdown Panel */}
      <div
        ref={menuRef}
        className="absolute right-0 top-full mt-2 w-[95vw] sm:w-[640px] md:w-[760px] lg:w-[960px] bg-deep-navy/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden"
        style={{ display: isOpen ? 'block' : 'none' }}
      >
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Kelompok 1: Pesan & Registrasi */}
          <div
            ref={setCardRef(0)}
            className="flex flex-col rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-all duration-300"
          >
            <div className="text-sm font-black text-white/90 border-b border-white/10 pb-2 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Pesan & Registrasi
            </div>
            <div className="flex flex-col gap-2 mt-auto">
              <button
                onClick={() => handleActionClick(onOpenEmailSetting)}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-all text-left"
              >
                <span className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  Pengaturan Email
                </span>
                <ArrowUpRight className="w-3 h-3 opacity-50" />
              </button>

              <button
                onClick={(e) => handleLinkClick(e, '/admin/email')}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-all text-left"
              >
                <span className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  Mengirim Email
                </span>
                <ArrowUpRight className="w-3 h-3 opacity-50" />
              </button>

              <button
                onClick={(e) => handleLinkClick(e, '/admin/registration/acceptance')}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-all text-left"
              >
                <span className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Penerimaan
                </span>
                <ArrowUpRight className="w-3 h-3 opacity-50" />
              </button>

              <button
                onClick={(e) => handleLinkClick(e, '/admin/registration/acceptance?showLinks=true')}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-all text-left"
              >
                <span className="flex items-center gap-2">
                  <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
                  Link Pendaftaran
                </span>
                <ArrowUpRight className="w-3 h-3 opacity-50" />
              </button>
            </div>
          </div>

          {/* Kelompok 2: Database */}
          <div
            ref={setCardRef(1)}
            className="flex flex-col rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-all duration-300"
          >
            <div className="text-sm font-black text-white/90 border-b border-white/10 pb-2 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E90FF]" />
              Database
            </div>
            <div className="flex flex-col gap-2 mt-auto">
              <button
                onClick={() => handleActionClick(onOptimizeDb)}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-all text-left"
              >
                <span className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-[#1E90FF]" />
                  Optimalkan DB
                </span>
                <ArrowUpRight className="w-3 h-3 opacity-50" />
              </button>

              <button
                onClick={(e) => handleLinkClick(e, '/api/admin/backup')}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-all text-left"
              >
                <span className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-[#1E90FF]" />
                  Backup SQL
                </span>
                <ArrowUpRight className="w-3 h-3 opacity-50" />
              </button>

              {userRole === 'administrator' && (
                <button
                  onClick={() => handleActionClick(onOpenCleanupWawancara)}
                  className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-all text-left"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    Bersihkan Wawancara
                  </span>
                  <ArrowUpRight className="w-3 h-3 opacity-50" />
                </button>
              )}
            </div>
          </div>

          {/* Kelompok 3: Pemantauan & Monitoring */}
          <div
            ref={setCardRef(2)}
            className="flex flex-col rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-all duration-300"
          >
            <div className="text-sm font-black text-white/90 border-b border-white/10 pb-2 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Pemantauan & Monitoring
            </div>
            <div className="flex flex-col gap-2 mt-auto">
              <button
                onClick={() => handleActionClick(onOpenAddUser)}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-all text-left"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  Tambah User
                </span>
                <ArrowUpRight className="w-3 h-3 opacity-50" />
              </button>

              <button
                onClick={(e) => handleLinkClick(e, '/log')}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-all text-left"
              >
                <span className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-amber-400" />
                  Riwayat Aktivitas
                </span>
                <ArrowUpRight className="w-3 h-3 opacity-50" />
              </button>

              <button
                onClick={(e) => handleLinkClick(e, '/api/export?tipe=admin')}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-all text-left"
              >
                <span className="flex items-center gap-2">
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                  Export Data (XLS)
                </span>
                <ArrowUpRight className="w-3 h-3 opacity-50" />
              </button>

              <button
                onClick={(e) => handleLinkClick(e, '/laporan')}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-all text-left"
              >
                <span className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-amber-400" />
                  Statistik Sistem
                </span>
                <ArrowUpRight className="w-3 h-3 opacity-50" />
              </button>
            </div>
          </div>

          {/* Kelompok 4: Kelola Organisasi Eskul */}
          <div
            ref={setCardRef(3)}
            className="flex flex-col rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-all duration-300"
          >
            <div className="text-sm font-black text-white/90 border-b border-white/10 pb-2 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-persian-blue" />
              Kelola Organisasi Eskul
            </div>
            <div className="flex flex-col gap-2 mt-auto">
              <button
                onClick={(e) => handleLinkClick(e, '/admin/organizations')}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-all text-left"
              >
                <span className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-persian-blue" />
                  Daftar Unit Eskul
                </span>
                <ArrowUpRight className="w-3 h-3 opacity-50" />
              </button>

              <button
                onClick={(e) => handleLinkClick(e, '/admin/members')}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-all text-left"
              >
                <span className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-persian-blue" />
                  Manajemen Anggota
                </span>
                <ArrowUpRight className="w-3 h-3 opacity-50" />
              </button>

              <button
                onClick={(e) => handleLinkClick(e, '/absensi')}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-all text-left"
              >
                <span className="flex items-center gap-2">
                  <CalendarCheck className="w-3.5 h-3.5 text-persian-blue" />
                  Modul Absensi
                </span>
                <ArrowUpRight className="w-3 h-3 opacity-50" />
              </button>

              <button
                onClick={(e) => handleLinkClick(e, '/kas')}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-all text-left"
              >
                <span className="flex items-center gap-2">
                  <Wallet className="w-3.5 h-3.5 text-persian-blue" />
                  Manajemen Kas
                </span>
                <ArrowUpRight className="w-3 h-3 opacity-50" />
              </button>

              <button
                onClick={(e) => handleLinkClick(e, '/admin/exp')}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-all text-left"
              >
                <span className="flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5 text-persian-blue" />
                  Level & Progress
                </span>
                <ArrowUpRight className="w-3 h-3 opacity-50" />
              </button>

              <button
                onClick={(e) => handleLinkClick(e, '/admin/organizations')}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-all text-left"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-persian-blue" />
                  Administrator Unit
                </span>
                <ArrowUpRight className="w-3 h-3 opacity-50" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDropdownMenu;
