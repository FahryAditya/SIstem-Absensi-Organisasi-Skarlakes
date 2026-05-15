'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { formatCurrency, formatDate, formatDateTime, ORG_LABELS, OrgType } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/auth-shared'
import { clearJsonCache, fetchJsonCachedUrl } from '@/lib/client-cache'
import TextType from '@/components/TextType'
import {
  Users, CheckCircle2, Wallet, UserPlus, LogOut, Clock, CalendarDays, PlusCircle, LayoutList, HandCoins, Loader2, UploadCloud, TrendingUp, Activity, X
} from 'lucide-react'

// Lazy load Recharts for better performance
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false })
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false })
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false })
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false })
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false })

interface Props {
  user: { id: number; nama: string; email: string; role: string }
}

interface StatsData {
  totalSiswa: number
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

interface LogData {
  recentLog: { id: number; user_nama: string; deskripsi: string; created_at: string; aksi: string }[]
}

const AKSI_COLORS: Record<string, string> = {
  CREATE: 'text-green-600 bg-green-50',
  UPDATE: 'text-blue-600 bg-blue-50',
  DELETE: 'text-red-600 bg-red-50',
  LOGIN:  'text-violet-600 bg-violet-50',
  LOGOUT: 'text-slate-600 bg-slate-100',
}

export default function DashboardClient({ user }: Props) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [charts, setCharts] = useState<ChartData | null>(null)
  const [logs, setLogs] = useState<LogData | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [loadingCharts, setLoadingCharts] = useState(true)
  const [loadingLogs, setLoadingLogs] = useState(true)

  const [now] = useState(new Date())
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)

  // Quick Add State
  const [quickOrg, setQuickOrg] = useState<string>('')
  const [quickName, setQuickName] = useState('')
  const [quickClass, setQuickClass] = useState('')
  const [quickJabatan, setQuickJabatan] = useState('')
  const [quickLoading, setQuickLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const orgs = stats?.orgs || []

  useEffect(() => {
    if (orgs.length > 0 && !quickOrg) setQuickOrg(orgs[0])
  }, [orgs, quickOrg])

  async function fetchDashboardData() {
    setLoading(true)
    // 1. Fetch Stats (Priority)
    try {
      const d = await fetchJsonCachedUrl<StatsData>('/api/dashboard?part=stats')
      setStats(d)
    } catch {}
    setLoading(false)

    // 2. Fetch Charts
    setLoadingCharts(true)
    try {
      const c = await fetchJsonCachedUrl<ChartData>('/api/dashboard?part=charts')
      setCharts(c)
    } catch {}
    setLoadingCharts(false)

    // 3. Fetch Logs (if admin)
    if (user.role === 'administrator') {
      setLoadingLogs(true)
      try {
        const l = await fetchJsonCachedUrl<LogData>('/api/dashboard?part=logs')
        setLogs(l)
      } catch {}
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    
    // Welcome popup logic for administrator
    if (user.role === 'administrator' && typeof window !== 'undefined') {
      if (!sessionStorage.getItem('welcome_shown')) {
        setShowWelcomeModal(true)
        sessionStorage.setItem('welcome_shown', 'true')
      }
    }
  }, [user.role])

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!quickName || !quickOrg) return toast.error('Nama wajib diisi')
    setQuickLoading(true)
    try {
      const data = [{ nama: quickName, kelas: quickClass, jabatan: quickJabatan }]
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org: quickOrg, data })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Anggota berhasil ditambahkan')
      setQuickName(''); setQuickClass(''); setQuickJabatan('')
      clearJsonCache()
      fetchDashboardData()
    } catch (e: any) {
      toast.error(e.message)
    }
    setQuickLoading(false)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !quickOrg) return
    setQuickLoading(true)
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const json = XLSX.utils.sheet_to_json<any>(worksheet)
      
      const matchKey = (row: any, targets: string[]) =>
        Object.keys(row).find((k: string) =>
          targets.some((t: string) => k.toLowerCase().includes(t.toLowerCase()))
        )

      const mappedData = (json as any[]).map((row: any) => {
        const kn = matchKey(row, ['Nama', 'nama', 'Name', 'name'])
        const ki = matchKey(row, ['Kelas', 'kelas', 'Class', 'class', 'Tingkat', 'tingkat'])
        const kns = matchKey(row, ['NIS', 'nis', 'NISN', 'nisn'])
        const kj = matchKey(row, ['Jabatan', 'jabatan', 'Posisi', 'posisi', 'Peran', 'peran'])
        return {
          nama:    kn  ? row[kn]  : '',
          kelas:   ki  ? row[ki]  : '',
          nis:     kns ? row[kns] : '',
          jabatan: kj  ? row[kj]  : '',
        }
      }).filter((item: any) => item.nama)

      if (mappedData.length === 0) throw new Error('Format kolom tidak sesuai atau file kosong. Pastikan ada kolom "Nama".')

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org: quickOrg, data: mappedData })
      })
      const apiJson = await res.json()
      if (!res.ok) throw new Error(apiJson.error)
      toast.success(`Berhasil import ${apiJson.count} data`)
      clearJsonCache()
      fetchDashboardData()
    } catch (err: any) {
      toast.error(err.message)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
    setQuickLoading(false)
  }

  const greetingHour = now.getHours()
  const greeting = greetingHour < 11 ? 'Selamat pagi' : greetingHour < 15 ? 'Selamat siang' : greetingHour < 18 ? 'Selamat sore' : 'Selamat malam'

  if (loading && !stats) return (
    <div className="flex items-center justify-center h-64 gap-3 text-slate-400">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">Memuat dashboard...</span>
    </div>
  )

  const statCards = stats ? [
    orgs.some(o => ['programming', 'english'].includes(o)) && {
      label: 'Total Siswa Ekskul',
      value: stats.totalSiswa,
      suffix: 'siswa',
      icon: Users,
      color: 'bg-[rgba(84,130,180,0.12)] text-[#5482B4]',
    },
    orgs.includes('osis') && {
      label: 'Anggota OSIS',
      value: stats.totalOsis,
      suffix: 'anggota',
      icon: Users,
      color: 'bg-[rgba(84,130,180,0.12)] text-[#5482B4]',
    },
    orgs.includes('mpk') && {
      label: 'Anggota MPK',
      value: stats.totalMpk,
      suffix: 'anggota',
      icon: Users,
      color: 'bg-[rgba(84,130,180,0.12)] text-[#5482B4]',
    },
    {
      label: 'Hadir Hari Ini',
      value: stats.hadirHariIni,
      suffix: 'orang',
      icon: CheckCircle2,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Sisa Saldo Kas',
      value: formatCurrency(stats.totalKas),
      isCurrency: true,
      icon: Wallet,
      color: 'bg-[rgba(84,130,180,0.12)] text-[#5482B4]',
    },
    {
      label: 'Total Pemasukan Kas',
      value: formatCurrency(stats.totalPemasukan),
      isCurrency: true,
      icon: PlusCircle,
      color: 'bg-[rgba(84,130,180,0.12)] text-[#5482B4]',
    },
    {
      label: 'Total Pengeluaran Kas',
      value: formatCurrency(stats.totalPengeluaran),
      isCurrency: true,
      icon: HandCoins,
      color: 'bg-red-50 text-red-600',
    },
  ].filter(Boolean) as { label: string; value: number | string; suffix?: string; isCurrency?: boolean; icon: React.ElementType; color: string }[] : []

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#052659] to-[#5482B4] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative">
          <div className="block w-full">
            <TextType as="p" text={`${greeting}, 👋`} className="text-[#C2E8FF] text-sm font-medium" typingSpeed={40} loop={false} showCursor={false} />
          </div>
          <div className="block w-full">
            <TextType as="h2" text={user.nama} className="text-2xl font-black mt-0.5" typingSpeed={60} initialDelay={600} loop={false} cursorClassName="text-white opacity-70" />
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">
              {ROLE_LABELS[user.role] || user.role}
            </span>
            <span className="text-xs text-[#C2E8FF] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(now, 'EEEE, dd MMMM yyyy')}
            </span>
          </div>
          {orgs.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {orgs.map(o => (
                <span key={o} className="text-xs font-bold bg-white/15 border border-white/25 px-2.5 py-1 rounded-lg">
                  {ORG_LABELS[o as OrgType] || o}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="stat-card flex-col gap-3 p-4">
            <div className={`stat-icon ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-[#7EA0C5] font-semibold leading-tight">{s.label}</div>
              <div className="text-xl font-black text-[#011025] mt-1 font-mono leading-none">
                {s.isCurrency ? s.value : `${s.value}`}
              </div>
              {s.suffix && <div className="text-[10px] text-[#7EA0C5] mt-0.5">{s.suffix}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Add & Import Section */}
      {orgs.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <PlusCircle className="w-5 h-5 text-[#5482B4]" />
            <h3 className="text-base font-bold text-[#011025]">Quick Add / Import Anggota</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Add Form */}
            <form onSubmit={handleQuickAdd} className="space-y-3">
              <div className="form-group">
                <label className="label">Unit / Organisasi Tujuan</label>
                <select value={quickOrg} onChange={e => setQuickOrg(e.target.value)} className="input bg-slate-50">
                  {orgs.map(o => (
                    <option key={o} value={o}>{ORG_LABELS[o as OrgType]}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Nama Lengkap</label>
                <input type="text" value={quickName} onChange={e => setQuickName(e.target.value)} className="input" placeholder="Misal: Budi Santoso" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Kelas</label>
                  <input type="text" value={quickClass} onChange={e => setQuickClass(e.target.value)} className="input" placeholder="X MIPA 1" />
                </div>
                {(quickOrg === 'osis' || quickOrg === 'mpk') && (
                  <div className="form-group">
                    <label className="label">Jabatan</label>
                    <input type="text" value={quickJabatan} onChange={e => setQuickJabatan(e.target.value)} className="input" placeholder="Anggota" />
                  </div>
                )}
              </div>
              <button type="submit" disabled={quickLoading} className="btn-primary w-full justify-center">
                {quickLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tambahkan'}
              </button>
            </form>

            {/* Bulk Import */}
            <div className="flex flex-col justify-center space-y-4 border-t md:border-t-0 md:border-l border-[rgba(84,130,180,0.15)] pt-4 md:pt-0 md:pl-6">
              <div>
                <h4 className="text-sm font-bold text-[#011025] mb-1">Import Massal (CSV/Excel)</h4>
                <p className="text-xs text-[#7EA0C5] leading-relaxed">
                  Upload file <b>.xlsx</b> atau <b>.csv</b>. Pastikan baris pertama memiliki header: <br/>
                  <code className="text-[#052659] bg-[#C2E8FF] px-1 py-0.5 rounded">Nama</code>, <code className="text-[#052659] bg-[#C2E8FF] px-1 py-0.5 rounded">Kelas</code>, <code className="text-[#052659] bg-[#C2E8FF] px-1 py-0.5 rounded">NIS</code>{(quickOrg === 'osis' || quickOrg === 'mpk') && <>, <code className="text-[#052659] bg-[#C2E8FF] px-1 py-0.5 rounded">Jabatan</code></>}.
                </p>
              </div>
              <input
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={quickLoading}
                className="btn-secondary w-full justify-center py-3 border-dashed border-2 bg-slate-50 hover:bg-slate-100"
              >
                {quickLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                ) : (
                  <><UploadCloud className="w-5 h-5 text-[#5482B4]" /> Pilih File Excel/CSV</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Kehadiran mingguan */}
        <div className="card p-5 min-h-[280px]">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#5482B4]" />
            <h3 className="text-sm font-bold text-[#011025]">Kehadiran 7 Hari Terakhir</h3>
          </div>
          {loadingCharts ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Memuat grafik...
            </div>
          ) : charts?.kehadiranMingguan && charts.kehadiranMingguan.some(d => d.hadir + d.tidak_hadir > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={charts.kehadiranMingguan} barSize={14} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="hadir" name="Hadir" fill="#5482B4" radius={[3,3,0,0]} />
                <Bar dataKey="tidak_hadir" name="Tidak Hadir" fill="#fca5a5" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">
              Belum ada data kehadiran minggu ini
            </div>
          )}
        </div>

        {/* Kas per bulan */}
        <div className="card p-5 min-h-[280px]">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-[#5482B4]" />
            <h3 className="text-sm font-bold text-[#011025]">Uang Kas 6 Bulan Terakhir</h3>
          </div>
          {loadingCharts ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Memuat grafik...
            </div>
          ) : charts?.kasPerBulan && charts.kasPerBulan.some(d => d.total > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={charts.kasPerBulan}>
                <defs>
                  <linearGradient id="kasGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5482B4" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#5482B4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Total Kas']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="total" stroke="#5482B4" strokeWidth={2.5}
                  fill="url(#kasGrad)" dot={{ r: 4, fill: '#5482B4', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">
              Belum ada data kas
            </div>
          )}
        </div>
      </div>

      {/* Recent activity log (administrator only) */}
      {user.role === 'administrator' && (
        <div className="card p-5 min-h-[150px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#5482B4]" />
              <h3 className="text-sm font-bold text-[#011025]">Aktivitas Terbaru</h3>
            </div>
            <a href="/log" className="text-xs font-semibold text-[#052659] hover:underline">Lihat semua →</a>
          </div>
          {loadingLogs ? (
            <div className="py-8 flex items-center justify-center text-sm text-slate-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Memuat aktivitas...
            </div>
          ) : logs?.recentLog && logs.recentLog.length > 0 ? (
            <div className="space-y-2">
              {logs.recentLog.map(log => (
                <div key={log.id} className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${AKSI_COLORS[log.aksi] || 'text-slate-600 bg-slate-100'}`}>
                    {log.aksi}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 leading-snug truncate">{log.deskripsi}</p>
                    <span className="text-xs text-slate-400">{formatDateTime(log.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-400">
              Tidak ada aktivitas terbaru
            </div>
          )}
        </div>
      )}

      {/* Welcome Modal */}
      {showWelcomeModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm slide-up">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative border border-slate-100">
            <button 
              onClick={() => setShowWelcomeModal(false)} 
              className="absolute top-3 right-3 p-1.5 bg-black/10 hover:bg-black/20 text-white rounded-full z-10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="h-32 bg-gradient-to-br from-[#052659] to-[#5482B4] relative">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>
            </div>
            <div className="px-6 pb-8 pt-0 text-center relative">
              <div className="w-24 h-24 mx-auto -mt-12 mb-4 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center relative">
                <Image 
                  src="https://uploads.onecompiler.io/43k3cj6jv/44p898awc/WhatsApp%20Image%202026-05-14%20at%2013.14.48%20(1).jpeg" 
                  alt="Administrator" 
                  fill
                  className="object-cover"
                />
              </div>
              <div className="block w-full">
                <TextType as="h2" text={`${greeting}, 👋`} className="text-2xl font-black text-[#011025] tracking-tight" typingSpeed={50} loop={false} showCursor={false} />
              </div>
              <div className="block w-full">
                <TextType as="p" text={user.nama} className="text-[#052659] font-bold mt-1 text-lg" typingSpeed={60} initialDelay={800} loop={false} cursorClassName="text-[#052659]" />
              </div>
              <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                Anda masuk sebagai Administrator. Selamat bekerja dan pantau terus perkembangan ekstrakurikuler serta organisasi!
              </p>
              <button 
                onClick={() => setShowWelcomeModal(false)}
                className="mt-6 w-full py-3 px-4 bg-[#052659] hover:bg-[#011025] text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                Mulai Bekerja 🚀
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
