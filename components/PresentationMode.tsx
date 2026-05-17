'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import dynamic from 'next/dynamic'
import { formatCurrency, formatDate, ORG_LABELS, OrgType } from '@/lib/utils'
import {
  X, Users, CheckCircle2, Wallet, TrendingUp,
  Maximize2, Minimize2, RefreshCw, Clock, Monitor
} from 'lucide-react'

// Lazy load charts
const ResponsiveContainer = dynamic<any>(() => import('recharts').then(m => m.ResponsiveContainer) as any, { ssr: false })
const BarChart = dynamic<any>(() => import('recharts').then(m => m.BarChart) as any, { ssr: false })
const Bar = dynamic<any>(() => import('recharts').then(m => m.Bar) as any, { ssr: false })
const XAxis = dynamic<any>(() => import('recharts').then(m => m.XAxis) as any, { ssr: false })
const YAxis = dynamic<any>(() => import('recharts').then(m => m.YAxis) as any, { ssr: false })
const CartesianGrid = dynamic<any>(() => import('recharts').then(m => m.CartesianGrid) as any, { ssr: false })
const Tooltip = dynamic<any>(() => import('recharts').then(m => m.Tooltip) as any, { ssr: false })
const AreaChart = dynamic<any>(() => import('recharts').then(m => m.AreaChart) as any, { ssr: false })
const Area = dynamic<any>(() => import('recharts').then(m => m.Area) as any, { ssr: false })

interface StatsData {
  totalSiswa: number
  totalProgramming: number
  totalEnglish: number
  totalOsis: number
  totalMpk: number
  hadirHariIni: number
  totalPemasukan: number
  totalPengeluaran: number
  totalKas: number
  orgs: string[]
}

interface ChartData {
  kehadiranMingguan: { day: string; hadir: number; tidak_hadir: number }[]
  kasPerBulan: { bulan: string; total: number }[]
}

interface PresentationModeProps {
  stats: StatsData | null
  charts: ChartData | null
  user: { nama: string; role: string }
}

/** Jam digital yang update setiap detik */
function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="font-mono tabular-nums">
      {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

/** Komponen hitung naik (count-up) angka besar yang halus & premium */
function AnimatedCounter({ 
  value, 
  duration = 1000, 
  isCurrency = false,
  prefix = "",
  suffix = "",
  className = ""
}: { 
  value: number
  duration?: number
  isCurrency?: boolean
  prefix?: string
  suffix?: string
  className?: string
}) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    let startTimestamp: number | null = null
    const startValue = 0
    const endValue = value

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      
      // Easing: easeOutExpo (melaju cepat di awal lalu melambat secara halus di akhir)
      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      
      const nextValue = Math.floor(easedProgress * (endValue - startValue) + startValue)
      setCurrent(nextValue)

      if (progress < 1) {
        window.requestAnimationFrame(step)
      } else {
        setCurrent(endValue)
      }
    }

    window.requestAnimationFrame(step)
  }, [value, duration])

  const formatted = isCurrency ? formatCurrency(current) : current.toLocaleString('id-ID')

  return (
    <span className={className}>
      {prefix}{formatted}{suffix}
    </span>
  )
}

export default function PresentationMode({ stats, charts, user }: PresentationModeProps) {
  const [open, setOpen] = useState(false)
  const [isBrowser, setIsBrowser] = useState(false)
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false)
  const [now] = useState(new Date())

  useEffect(() => { setIsBrowser(true) }, [])

  // Keyboard shortcut: Escape to close, F to toggle fullscreen
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key === 'f' || e.key === 'F') toggleNativeFullscreen()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, isNativeFullscreen])

  // iOS-safe scroll locking & layout viewport protection
  useEffect(() => {
    if (!open) return
    const originalOverflow = document.body.style.overflow
    const originalPosition = document.body.style.position
    const originalWidth = document.body.style.width
    const originalHeight = document.body.style.height

    // Lock scroll to prevent rubber-banding on iOS Safari
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.height = '100%'

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.position = originalPosition
      document.body.style.width = originalWidth
      document.body.style.height = originalHeight
    }
  }, [open])

  // Sync native fullscreen state
  useEffect(() => {
    const onChange = () => setIsNativeFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleNativeFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.()
    } else {
      await document.exitFullscreen?.()
    }
  }, [])

  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    setOpen(false)
  }

  const orgs = stats?.orgs || []

  // Stat cards untuk presentasi
  const presCards = stats ? [
    {
      label: 'Total Siswa',
      value: stats.totalSiswa,
      suffix: 'siswa',
      icon: Users,
      accent: '#5482B4',
      glow: 'rgba(84,130,180,0.35)',
    },
    {
      label: 'Hadir Hari Ini',
      value: stats.hadirHariIni,
      suffix: 'orang',
      icon: CheckCircle2,
      accent: '#22c55e',
      glow: 'rgba(34,197,94,0.35)',
    },
    {
      label: 'Saldo Kas',
      value: stats.totalKas,
      icon: Wallet,
      accent: '#f59e0b',
      glow: 'rgba(245,158,11,0.35)',
      isCurrency: true,
    },
    {
      label: 'Total Pemasukan',
      value: stats.totalPemasukan,
      icon: TrendingUp,
      accent: '#06b6d4',
      glow: 'rgba(6,182,212,0.35)',
      isCurrency: true,
    },
  ] : []

  if (!stats) return null

  return (
    <>
      {/* Tombol Trigger — muncul di dashboard */}
      <button
        id="btn-presentation-mode"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl
          bg-[#052659] text-white shadow-lg shadow-[#052659]/30
          hover:bg-[#011025] hover:shadow-xl hover:shadow-[#052659]/40
          hover:-translate-y-0.5 active:scale-95
          transition-all duration-200 border border-white/10"
        title="Buka Mode Presentasi (cocok untuk proyektor)"
      >
        <Monitor className="w-4 h-4" />
        <span className="hidden sm:inline">Mode Presentasi</span>
        <Maximize2 className="w-3.5 h-3.5 opacity-70" />
      </button>

      {/* Fullscreen Overlay Portal */}
      {isBrowser && open && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex flex-col presentation-enter"
          style={{
            background: 'linear-gradient(135deg, #011025 0%, #021840 40%, #031e5c 70%, #052659 100%)',
          }}
        >
          {/* Dot grid background pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.07]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          {/* Glowing orbs for visual depth */}
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(84,130,180,0.15) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)' }} />

          {/* ── TOP BAR ───────────────────────────────────────────── */}
          <div className="relative flex items-center justify-between px-4 md:px-8 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 md:py-4 border-b border-white/10 flex-shrink-0">
            {/* Left side: Minimal Brand (Mobile) or Mode Presentasi (Desktop) */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50" />
              {/* Mobile title */}
              <span className="text-white font-black text-sm md:hidden tracking-tight">
                Sistem Ekskul
              </span>
              {/* Desktop details */}
              <span className="hidden md:inline text-white/60 text-sm font-semibold tracking-wide uppercase">
                Mode Presentasi
              </span>
              <span className="hidden md:inline text-white/30 text-sm">·</span>
              <span className="hidden md:inline text-white/50 text-xs">
                {formatDate(now, 'EEEE, dd MMMM yyyy')}
              </span>
            </div>

            {/* Center: App name (Desktop only to prevent mobile overlap) */}
            <div className="hidden md:block absolute left-1/2 -translate-x-1/2 text-center">
              <div className="text-white font-black text-lg tracking-tight">Sistem Ekskul</div>
              <div className="text-white/40 text-xs font-medium">Skarlakes V18.0.1 Artemis</div>
            </div>

            {/* Right side: Clock & Actions */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Live clock */}
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1.5 md:px-4 md:py-2 rounded-xl text-white/80 text-xs md:text-sm">
                <Clock className="w-3.5 h-3.5 text-white/50" />
                <LiveClock />
              </div>

              {/* Native fullscreen toggle */}
              <button
                onClick={toggleNativeFullscreen}
                className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-xl bg-white/5 border border-white/10
                  hover:bg-white/10 text-white/60 hover:text-white transition-all"
                title={isNativeFullscreen ? 'Keluar Fullscreen (F)' : 'Fullscreen Penuh (F)'}
              >
                {isNativeFullscreen ? <Minimize2 className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Maximize2 className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              </button>

              {/* Close */}
              <button
                onClick={handleClose}
                className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-xl bg-white/5 border border-white/10
                  hover:bg-red-500/20 hover:border-red-500/30 text-white/60 hover:text-red-400 transition-all"
                title="Tutup (Esc)"
              >
                <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            </div>
          </div>

          {/* ── MAIN CONTENT ─────────────────────────────────────── */}
          <div className="relative flex-1 overflow-auto p-6 xl:p-8">
            <div className="h-full flex flex-col gap-6 max-w-screen-2xl mx-auto">

              {/* Stat cards — 4 kartu besar */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
                {presCards.map((card) => (
                  <div
                    key={card.label}
                    className="relative rounded-2xl p-6 flex flex-col gap-3 overflow-hidden border"
                    style={{
                      background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`,
                      borderColor: `${card.accent}30`,
                      boxShadow: `0 0 40px ${card.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
                    }}
                  >
                    {/* Accent glow top-right */}
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
                      style={{ background: `radial-gradient(circle at 100% 0%, ${card.glow} 0%, transparent 60%)` }} />

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold uppercase tracking-wider"
                        style={{ color: card.accent }}>
                        {card.label}
                      </span>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `${card.accent}20` }}>
                        <card.icon className="w-5 h-5" style={{ color: card.accent }} />
                      </div>
                    </div>

                    {card.isCurrency ? (
                      <div className="font-black text-white leading-none truncate">
                        <AnimatedCounter value={card.value} isCurrency={true} className="text-2xl sm:text-3xl xl:text-4xl block truncate" />
                      </div>
                    ) : (
                      <div className="flex items-end gap-1 leading-none truncate">
                        <AnimatedCounter value={card.value} className="text-5xl sm:text-6xl xl:text-7xl font-black text-white tracking-tighter block truncate" />
                        {card.suffix && <span className="text-xl sm:text-2xl font-bold text-white/60 mb-1.5 ml-1 flex-shrink-0">{card.suffix}</span>}
                      </div>
                    )}

                    {/* Org breakdown badges */}
                    {card.label === 'Total Siswa' && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {orgs.includes('programming') && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                            Programming: <AnimatedCounter value={stats.totalProgramming} duration={1200} />
                          </span>
                        )}
                        {orgs.includes('english') && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                            English: <AnimatedCounter value={stats.totalEnglish} duration={1200} />
                          </span>
                        )}
                        {orgs.includes('osis') && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                            OSIS: <AnimatedCounter value={stats.totalOsis} duration={1200} />
                          </span>
                        )}
                        {orgs.includes('mpk') && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                            MPK: <AnimatedCounter value={stats.totalMpk} duration={1200} />
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
                {/* Kehadiran mingguan */}
                <div
                  className="rounded-2xl p-6 flex flex-col border border-white/10 min-h-[280px]"
                  style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)' }}
                >
                  <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-[#5482B4]" />
                    <h3 className="text-base font-black text-white tracking-tight">Kehadiran 7 Hari Terakhir</h3>
                  </div>
                  <div className="w-full h-[220px] md:h-[260px] min-h-0 relative">
                    {charts?.kehadiranMingguan && charts.kehadiranMingguan.some(d => d.hadir + d.tidak_hadir > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={charts.kehadiranMingguan} barSize={20} barGap={4} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                          <XAxis dataKey="day" tick={{ fontSize: 13, fill: 'rgba(255,255,255,0.5)', fontWeight: 600 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ fontSize: 13, borderRadius: 12, background: '#021840', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                            labelStyle={{ fontWeight: 700, color: 'white' }}
                          />
                          <Bar dataKey="hadir" name="Hadir" fill="#5482B4" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="tidak_hadir" name="Tidak Hadir" fill="rgba(248,113,113,0.7)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-white/30 text-sm">
                        Belum ada data kehadiran minggu ini
                      </div>
                    )}
                  </div>
                </div>

                {/* Kas per bulan */}
                <div
                  className="rounded-2xl p-6 flex flex-col border border-white/10 min-h-[280px]"
                  style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)' }}
                >
                  <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                    <Wallet className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-black text-white tracking-tight">Kas Bersih 6 Bulan Terakhir</h3>
                  </div>
                  <div className="w-full h-[220px] md:h-[260px] min-h-0 relative">
                    {charts?.kasPerBulan && charts.kasPerBulan.some(d => d.total !== 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={charts.kasPerBulan} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="presKasGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                          <XAxis dataKey="bulan" tick={{ fontSize: 13, fill: 'rgba(255,255,255,0.5)', fontWeight: 600 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false}
                            tickFormatter={(v: number) => v >= 1000 ? `${v / 1000}k` : String(v)} />
                          <Tooltip
                            formatter={(v: number) => [formatCurrency(v), 'Total Kas']}
                            contentStyle={{ fontSize: 13, borderRadius: 12, background: '#021840', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                            labelStyle={{ fontWeight: 700, color: 'white' }}
                          />
                          <Area type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={3}
                            fill="url(#presKasGrad)" dot={{ r: 5, fill: '#f59e0b', strokeWidth: 0 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-white/30 text-sm">
                        Belum ada data kas
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── BOTTOM BAR ────────────────────────────────────────── */}
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-3 px-4 md:px-8 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] border-t border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              {orgs.map(o => (
                <span key={o} className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-white/60 border border-white/10">
                  {ORG_LABELS[o as OrgType] || o}
                </span>
              ))}
            </div>
            <div className="text-white/30 text-xs font-medium">
              Tekan <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-mono">Esc</kbd> untuk menutup &nbsp;·&nbsp;
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-mono">F</kbd> untuk fullscreen
            </div>
            <div className="text-white/30 text-xs">
              Dipresentasikan oleh <span className="text-white/50 font-semibold">{user.nama}</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
