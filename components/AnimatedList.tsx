import React, { useRef, useState, useEffect, useCallback, ReactNode, MouseEventHandler, UIEvent } from 'react';

// ─── Tipe & Preset Menu Administrator ────────────────────────────────────────
export interface AdminMenuItem {
  label: string;
  section?: string;
  href?: string;
  icon?: string; // nama icon opsional (untuk render kustom)
}

/**
 * Daftar menu lengkap untuk peran Administrator.
 * Bisa digunakan langsung via prop `administratorItems` pada AnimatedList.
 */
export const ADMINISTRATOR_MENU_ITEMS: AdminMenuItem[] = [
  // Utama
  { label: 'Dashboard',               section: 'Utama',         href: '/dashboard' },
  { label: 'Laporan Statistik',        section: 'Utama',         href: '/laporan' },
  { label: 'Buku Kas',                 section: 'Utama',         href: '/kas' },
  { label: 'Pengeluaran Kas',          section: 'Utama',         href: '/pengeluaran' },
  // Ekstrakurikuler
  { label: 'Siswa Programming',        section: 'Ekstrakurikuler', href: '/siswa?org=programming' },
  { label: 'Absensi Programming',      section: 'Ekstrakurikuler', href: '/absensi?org=programming' },
  { label: 'Siswa English',            section: 'Ekstrakurikuler', href: '/siswa?org=english' },
  { label: 'Absensi English',          section: 'Ekstrakurikuler', href: '/absensi?org=english' },
  // Organisasi
  { label: 'OSIS',                     section: 'Organisasi',    href: '/organisasi?org=osis' },
  { label: 'MPK',                      section: 'Organisasi',    href: '/organisasi?org=mpk' },
  { label: 'Wawancara OSIS & MPK',     section: 'Organisasi',    href: '/wawancara' },
  // Tools
  { label: 'Kelola User',              section: 'Tools',         href: '/admin' },
  { label: 'Import Excel',             section: 'Tools',         href: '/import' },
  { label: 'Export Data',              section: 'Tools',         href: '/export' },
  { label: 'Update Sistem',            section: 'Tools',         href: '/update-sistem' },
  { label: 'QR Code Wawancara',        section: 'Tools',         href: '/qr-code' },
  { label: 'Hapus Peserta Wawancara',  section: 'Tools',         href: '/hapus-peserta' },
  { label: 'Log Aktivitas',            section: 'Tools',         href: '/log' },
  { label: 'Backup SQL',               section: 'Tools',         href: '/api/admin/backup' },
];

// Detect if we should reduce/skip animations (only prefers-reduced-motion, NOT mobile)
function useReducedAnimation() {
  const [reduced, setReduced] = useState(false); // default false agar animasi aktif semua device
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

interface AnimatedItemProps {
  children: ReactNode;
  delay?: number;
  index: number;
  onMouseEnter?: MouseEventHandler<HTMLDivElement>;
  onClick?: MouseEventHandler<HTMLDivElement>;
  className?: string;
  reduced?: boolean;
  /** Root element untuk IntersectionObserver — gunakan scroll container sidebar */
  scrollRoot?: Element | null;
}

const AnimatedItem: React.FC<AnimatedItemProps> = ({
  children,
  delay = 0,
  index,
  onMouseEnter,
  onClick,
  className = '',
  reduced = false,
  scrollRoot,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  // Mulai invisible; akan visible saat masuk ke dalam scroll container
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (reduced) { setVisible(true); return; }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      {
        // Gunakan scroll container sidebar sebagai root, bukan viewport
        root: scrollRoot ?? null,
        threshold: 0.05,
        // Sedikit margin bawah agar item mulai animate sebelum benar-benar terlihat
        rootMargin: '0px 0px -10px 0px',
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced, scrollRoot]);

  return (
    <div
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={`mb-1 cursor-pointer ${className}`}
      style={reduced ? undefined : {
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: visible
          ? `opacity 0.3s cubic-bezier(0.4,0,0.2,1) ${delay}s, transform 0.3s cubic-bezier(0.4,0,0.2,1) ${delay}s`
          : 'none',
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
};

interface AnimatedListProps<T> {
  items?: T[];
  /** Jika true, gunakan ADMINISTRATOR_MENU_ITEMS sebagai items default (hanya berlaku saat items tidak diberikan) */
  administratorItems?: boolean;
  onItemSelect?: (item: T, index: number) => void;
  renderItem?: (item: T, index: number, isSelected: boolean) => ReactNode;
  showGradients?: boolean;
  enableArrowNavigation?: boolean;
  className?: string;
  listClassName?: string;
  itemClassName?: string;
  displayScrollbar?: boolean;
  initialSelectedIndex?: number;
  selectedIndex?: number;
}

const AnimatedList = <T,>({
  items,
  administratorItems = false,
  onItemSelect,
  renderItem,
  showGradients = true,
  enableArrowNavigation = true,
  className = '',
  listClassName = '',
  itemClassName = '',
  displayScrollbar = true,
  initialSelectedIndex = -1,
  selectedIndex: controlledSelectedIndex
}: AnimatedListProps<T>) => {
  // Gunakan ADMINISTRATOR_MENU_ITEMS jika prop administratorItems=true dan items tidak disupply
  const resolvedItems: T[] = (items && items.length > 0)
    ? items
    : administratorItems
      ? (ADMINISTRATOR_MENU_ITEMS as unknown as T[])
      : [];
  const reduced = useReducedAnimation();
  const listRef = useRef<HTMLDivElement>(null);
  const [internalSelectedIndex, setInternalSelectedIndex] = useState<number>(initialSelectedIndex);
  
  const selectedIndex = controlledSelectedIndex !== undefined ? controlledSelectedIndex : internalSelectedIndex;
  const setSelectedIndex = useCallback((index: number) => {
    if (controlledSelectedIndex === undefined) {
      setInternalSelectedIndex(index);
    }
  }, [controlledSelectedIndex]);

  const [keyboardNav, setKeyboardNav] = useState<boolean>(false);
  const [topGradientOpacity, setTopGradientOpacity] = useState<number>(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState<number>(1);

  const handleItemMouseEnter = useCallback((index: number) => {
    setSelectedIndex(index);
  }, [setSelectedIndex]);

  const handleItemClick = useCallback(
    (item: T, index: number) => {
      setSelectedIndex(index);
      if (onItemSelect) {
        onItemSelect(item, index);
      }
    },
    [onItemSelect, setSelectedIndex]
  );

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target as HTMLDivElement;
    setTopGradientOpacity(Math.min(scrollTop / 30, 1));
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 30, 1));
  };

  useEffect(() => {
    if (!enableArrowNavigation) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex(Math.min(selectedIndex + 1, resolvedItems.length - 1));
      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex(Math.max(selectedIndex - 1, 0));
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < resolvedItems.length) {
          e.preventDefault();
          if (onItemSelect) {
            onItemSelect(resolvedItems[selectedIndex], selectedIndex);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resolvedItems, selectedIndex, onItemSelect, enableArrowNavigation, setSelectedIndex]);

  useEffect(() => {
    if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;
    const container = listRef.current;
    const selectedItem = container.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement | null;
    if (selectedItem) {
      const extraMargin = 40;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const itemTop = selectedItem.offsetTop;
      const itemBottom = itemTop + selectedItem.offsetHeight;
      if (itemTop < containerScrollTop + extraMargin) {
        container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' });
      } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
        container.scrollTo({
          top: itemBottom - containerHeight + extraMargin,
          behavior: 'smooth'
        });
      }
    }
    setKeyboardNav(false);
  }, [selectedIndex, keyboardNav]);

  return (
    <div className={`relative flex flex-col h-full w-full ${className}`}>
      <div
        ref={listRef}
        className={`flex-1 overflow-y-auto px-1 py-2 ${listClassName} ${
          displayScrollbar
            ? 'scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent'
            : 'scrollbar-hide'
        }`}
        onScroll={handleScroll}
        style={{
          scrollbarWidth: displayScrollbar ? 'thin' : 'none',
        }}
      >
        {resolvedItems.map((item, index) => (
          <AnimatedItem
            key={index}
            delay={reduced ? 0 : index * 0.04}
            index={index}
            onMouseEnter={() => handleItemMouseEnter(index)}
            onClick={() => handleItemClick(item, index)}
            className={itemClassName}
            reduced={reduced}
            scrollRoot={listRef.current}
          >
            {renderItem ? (
              renderItem(item, index, selectedIndex === index)
            ) : (
              <div className={`p-3 bg-white/5 rounded-lg border border-white/5 transition-colors ${selectedIndex === index ? 'bg-white/10 border-white/10' : ''}`}>
                <p className="text-white text-sm m-0">{String(item)}</p>
              </div>
            )}
          </AnimatedItem>
        ))}
      </div>
      {showGradients && (
        <>
          <div
            className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#011025] to-transparent pointer-events-none transition-opacity duration-300 z-10"
            style={{ opacity: topGradientOpacity }}
          ></div>
          <div
            className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#011025] to-transparent pointer-events-none transition-opacity duration-300 z-10"
            style={{ opacity: bottomGradientOpacity }}
          ></div>
        </>
      )}
    </div>
  );
};

export default AnimatedList;

