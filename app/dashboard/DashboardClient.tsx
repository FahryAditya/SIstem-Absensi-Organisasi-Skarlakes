'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { formatCurrency, formatDate, formatDateTime, ORG_LABELS, OrgType } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/auth-shared'
import { clearJsonCache, fetchJsonCachedUrl, clientQueryClient } from '@/lib/client-cache'
import { pusherClient } from '@/lib/pusher-client'
import TextType from '@/components/TextType'
import Select from '@/components/ui/Select'
import { LevelBadge } from '@/components/ui/LevelBadge'
import PresentationMode from '@/components/PresentationMode'
import FilePresentationMode from '@/components/FilePresentationMode'
import {
  Users, CheckCircle2, Wallet, UserPlus, LogOut, Clock, CalendarDays, PlusCircle, LayoutList, HandCoins, Loader2, UploadCloud, TrendingUp, Activity, X, Megaphone, Sparkles, PlusCircle as PlusCircleIcon, Zap, ArrowUpDown, MousePointerClick, RefreshCw, Trash2, Trophy, Camera
} from 'lucide-react'

// Lazy load Recharts for better performance
const ResponsiveContainer = dynamic<any>(() => import('recharts').then(mod => mod.ResponsiveContainer) as any, { ssr: false })
const BarChart = dynamic<any>(() => import('recharts').then(mod => mod.BarChart) as any, { ssr: false })
const Bar = dynamic<any>(() => import('recharts').then(mod => mod.Bar) as any, { ssr: false })
const XAxis = dynamic<any>(() => import('recharts').then(mod => mod.XAxis) as any, { ssr: false })
const YAxis = dynamic<any>(() => import('recharts').then(mod => mod.YAxis) as any, { ssr: false })
const CartesianGrid = dynamic<any>(() => import('recharts').then(mod => mod.CartesianGrid) as any, { ssr: false })
const Tooltip = dynamic<any>(() => import('recharts').then(mod => mod.Tooltip) as any, { ssr: false })
const Legend = dynamic<any>(() => import('recharts').then(mod => mod.Legend) as any, { ssr: false })
const AreaChart = dynamic<any>(() => import('recharts').then(mod => mod.AreaChart) as any, { ssr: false })
const Area = dynamic<any>(() => import('recharts').then(mod => mod.Area) as any, { ssr: false })
const LineChart = dynamic<any>(() => import('recharts').then(mod => mod.LineChart) as any, { ssr: false })
const Line = dynamic<any>(() => import('recharts').then(mod => mod.Line) as any, { ssr: false })

interface Props {
  user: { id: number; nama: string; email: string; role: string }
}

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
  leaderboardProgramming?: { id: number; nama: string; kelas: string; xp: number }[]
  leaderboardEnglish?: { id: number; nama: string; kelas: string; xp: number }[]
}

interface ChartData {
  kehadiranMingguan: { day: string; hadir: number; tidak_hadir: number }[]
  kasPerBulan: { bulan: string; total: number }[]
}

interface LogData {
  recentLog: { id: number; user_nama: string; deskripsi: string; created_at: string; aksi: string }[]
}

interface RequestStatsData {
  grandTotal: number
  perAksi: { aksi: string; method: string; count: number }[]
  daily30: { date: string; label: string; CREATE: number; UPDATE: number; DELETE: number; LOGIN: number; LOGOUT: number }[]
}

const AKSI_COLORS: Record<string, string> = {
  CREATE: 'text-green-600 bg-green-50',
  UPDATE: 'text-blue-600 bg-blue-50',
  DELETE: 'text-red-600 bg-red-50',
  LOGIN:  'text-violet-600 bg-violet-50',
  LOGOUT: 'text-slate-600 bg-slate-100',
}

// Request stats visual config per aksi
const REQUEST_META: Record<string, { label: string; method: string; color: string; chartColor: string; icon: React.ElementType; bg: string }> = {
  CREATE: { label: 'Create',  method: 'POST',   color: 'text-emerald-700', chartColor: '#10b981', icon: PlusCircle,         bg: 'bg-emerald-50 border-emerald-200' },
  UPDATE: { label: 'Update',  method: 'PUT',    color: 'text-blue-700',    chartColor: '#3b82f6', icon: RefreshCw,          bg: 'bg-blue-50   border-blue-200'    },
  DELETE: { label: 'Delete',  method: 'DELETE', color: 'text-red-700',     chartColor: '#ef4444', icon: Trash2,             bg: 'bg-red-50    border-red-200'     },
  LOGIN:  { label: 'Login',   method: 'GET',    color: 'text-violet-700',  chartColor: '#8b5cf6', icon: MousePointerClick,  bg: 'bg-violet-50 border-violet-200'  },
  LOGOUT: { label: 'Logout',  method: 'GET',    color: 'text-slate-600',   chartColor: '#94a3b8', icon: ArrowUpDown,        bg: 'bg-slate-50  border-slate-200'   },
}

export default function DashboardClient({ user }: Props) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [charts, setCharts] = useState<ChartData | null>(null)
  const [logs, setLogs] = useState<LogData | null>(null)
  const [latestUpdate, setLatestUpdate] = useState<any>(null)
  const [requestStats, setRequestStats] = useState<RequestStatsData | null>(null)
  const [loadingRequestStats, setLoadingRequestStats] = useState(true)
  
  const [loading, setLoading] = useState(true)
  const [loadingCharts, setLoadingCharts] = useState(true)
  const [loadingLogs, setLoadingLogs] = useState(true)

  const [now] = useState(new Date())
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)

  // Quick Add State
  const [quickOrg, setQuickOrg] = useState<string>('')
  const [quickName, setQuickName] = useState('')
  const [quickLevel, setQuickLevel] = useState('X')
  const [quickSchool, setQuickSchool] = useState<'Skarla' | 'Skakes'>('Skarla')
  const [quickMajor, setQuickMajor] = useState('PPLG')
  const [quickJabatan, setQuickJabatan] = useState('Anggota')
  const [quickLoading, setQuickLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const orgs = stats?.orgs || []
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<'programming' | 'english'>('programming')

  useEffect(() => {
    if (orgs.length > 0 && !quickOrg) setQuickOrg(orgs[0])
    if (orgs.includes('programming')) {
      setActiveLeaderboardTab('programming')
    } else if (orgs.includes('english')) {
      setActiveLeaderboardTab('english')
    }
  }, [orgs, quickOrg])

  async function fetchDashboardData(forceRefresh = false) {
    setLoading(true)
    setLoadingCharts(true)
    setLoadingLogs(true)
    setLoadingRequestStats(true)
    if (forceRefresh) {
      clearDashboardCache() 
    }
    try {
      const [d, c] = await Promise.all([
        fetchJsonCachedUrl<StatsData>('/api/dashboard?part=stats'),
        fetchJsonCachedUrl<ChartData>('/api/dashboard?part=charts'),
      ])
      setStats(d)
      setCharts(c)
    } catch {}
    setLoading(false)
    setLoadingCharts(false)
    if (user.role === 'administrator') {
      try {
        const [l, rsRaw] = await Promise.all([
          fetchJsonCachedUrl<LogData>('/api/dashboard?part=logs'),
          fetchJsonCachedUrl<any>('/api/dashboard?part=request_stats'),
        ])
        setLogs(l)
        // API returns { orgs, requestStats: { grandTotal, perAksi, daily30 } }
        // so we must extract the nested .requestStats property
        setRequestStats(rsRaw?.requestStats ?? null)
      } catch {}
      setLoadingLogs(false)
      setLoadingRequestStats(false)
    }
  }

  function clearDashboardCache() {
    const parts: string[] = ['stats', 'charts', 'logs', 'kas', 'members', 'absensi', 'request_stats']
    parts.forEach(p => {
      clientQueryClient.removeQueries({ queryKey: ['client-json', '/api/dashboard?part=' + p], exact: true })
    })
    clientQueryClient.removeQueries({ queryKey: ['client-json', '/api/dashboard'], exact: true })
    clientQueryClient.removeQueries({ queryKey: ['client-json', '/api/dashboard?part=all'], exact: true })
  }

  useEffect(() => {
    fetchDashboardData()

    if (pusherClient) {
      const channel = pusherClient.subscribe('absensi')
      channel.bind('absensi-updated', (data: any) => {
        const who = data.userNama ? `${data.userNama} ` : ''
        toast.success(`Absensi/Anggota diperbarui oleh ${who}! Sinkronisasi statistik...`, { id: 'realtime-absensi' })
        fetchDashboardData(true)
      })
    }
    
    async function checkUpdates() {
      try {
        const res = await fetch('/api/system-update')
        const data = await res.json()
        
        if (data.latestUpdate) {
          setLatestUpdate(data.latestUpdate)
          if (data.latestUpdate.id > data.lastSeenId) {
            setShowWelcomeModal(true)
          } else if (user.role === 'administrator' && !sessionStorage.getItem('welcome_shown')) {
            setShowWelcomeModal(true)
            sessionStorage.setItem('welcome_shown', 'true')
          }
        } else if (user.role === 'administrator' && !sessionStorage.getItem('welcome_shown')) {
          setShowWelcomeModal(true)
          sessionStorage.setItem('welcome_shown', 'true')
        }
      } catch (e) {
        console.error('Failed to fetch update info', e)
      }
    }
    
    checkUpdates()

    return () => {
      if (pusherClient) {
        pusherClient.unsubscribe('absensi')
      }
    }
  }, [user.role])

  async function handleDismissUpdate() {
    setShowWelcomeModal(false)
    if (latestUpdate) {
      try {
        await fetch('/api/system-update/seen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updateId: latestUpdate.id })
        })
      } catch (e) {
        console.error('Failed to mark update as seen', e)
      }
    }
  }

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!quickName || !quickOrg) return toast.error('Nama wajib diisi')
    if (!/^[a-zA-Z\s]*$/.test(quickName)) {
      toast.error('Nama hanya boleh berisi huruf (A-Z)')
      return
    }
    setQuickLoading(true)
    try {
      const finalClass = `${quickLevel} ${quickMajor}`.trim()
      const data = [{ nama: quickName, kelas: finalClass, jabatan: quickJabatan }]
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org: quickOrg, data })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Anggota berhasil ditambahkan')
      setQuickName(''); setQuickJabatan('Anggota')
      clearJsonCache()
      fetchDashboardData(true)
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
      fetchDashboardData(true)
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

  const statCards = stats ? ([
    {
      label: 'Total Siswa Ekskul',
      value: stats.totalSiswa,
      suffix: 'siswa',
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600',
    },
    orgs.includes('programming') && {
      label: 'Total Programming',
      value: stats.totalProgramming,
      suffix: 'siswa',
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600',
    },
    orgs.includes('english') && {
      label: 'Total English Club',
      value: stats.totalEnglish,
      suffix: 'siswa',
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600',
    },
    orgs.includes('osis') && {
      label: 'Anggota OSIS',
      value: stats.totalOsis,
      suffix: 'anggota',
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600',
    },
    orgs.includes('mpk') && {
      label: 'Anggota MPK',
      value: stats.totalMpk,
      suffix: 'anggota',
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600',
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
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Total Pemasukan Kas',
      value: formatCurrency(stats.totalPemasukan),
      isCurrency: true,
      icon: PlusCircle,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Total Pengeluaran Kas',
      value: formatCurrency(stats.totalPengeluaran),
      isCurrency: true,
      icon: HandCoins,
      color: 'bg-red-50 text-red-600',
    },
  ].filter(Boolean) as { label: string; value: number | string; suffix?: string; isCurrency?: boolean; icon: React.ElementType; color: string }[]) : []

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="block w-full">
              <TextType as="p" text={`${greeting}, 👋`} className="text-indigo-200 text-sm font-medium" typingSpeed={40} loop={false} showCursor={false} />
            </div>
            <div className="block w-full">
              <TextType as="h2" text={user.nama} className="text-2xl font-black mt-0.5" typingSpeed={60} initialDelay={600} loop={false} cursorClassName="text-white opacity-70" />
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">
                {ROLE_LABELS[user.role] || user.role}
              </span>
              <span className="text-xs text-indigo-200 flex items-center gap-1">
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
          {/* Tombol Mode Presentasi & Presentasi File */}
          <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2">
            {user.role === 'administrator' && (
              <Link href="/admin" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all">
                <Trophy className="w-4 h-4 text-yellow-300" />
                Beri Penghargaan
              </Link>
            )}
            <PresentationMode stats={stats} charts={charts} user={user} />
            <FilePresentationMode user={user} />
          </div>
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
              <div className="text-xs text-slate-500 font-semibold leading-tight">{s.label}</div>
              <div className="text-xl font-black text-slate-900 mt-1 font-mono leading-none">
                {s.isCurrency ? s.value : `${s.value}`}
              </div>
              {s.suffix && <div className="text-[10px] text-slate-500 mt-0.5">{s.suffix}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Add & Import Section */}
      {orgs.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <PlusCircleIcon className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Quick Add / Import Anggota</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Add Form */}
            <form onSubmit={handleQuickAdd} className="space-y-3">
              <div className="form-group">
                <label className="label">Unit / Organisasi Tujuan</label>
                <Select
                  value={quickOrg}
                  onChange={setQuickOrg}
                  options={orgs.map(o => ({ value: o, label: ORG_LABELS[o as OrgType] }))}
                />
              </div>
              <div className="form-group">
                <label className="label">Nama Lengkap</label>
                <input
                  type="text"
                  value={quickName}
                  onChange={e => {
                    const val = e.target.value
                    if (val === '' || /^[a-zA-Z\s]*$/.test(val)) setQuickName(val)
                  }}
                  className="input"
                  placeholder="Misal: Budi Santoso"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Tingkat</label>
                  <Select
                    value={quickLevel}
                    onChange={setQuickLevel}
                    options={[
                      { value: 'X',   label: 'Kelas X'   },
                      { value: 'XI',  label: 'Kelas XI'  },
                      { value: 'XII', label: 'Kelas XII' },
                    ]}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Pilih Sekolah</label>
                  <Select
                    value={quickSchool}
                    onChange={v => {
                      const school = v as 'Skarla' | 'Skakes'
                      setQuickSchool(school)
                      setQuickMajor(school === 'Skarla' ? 'PPLG' : 'FKK')
                    }}
                    options={[
                      { value: 'Skarla', label: 'Skarla' },
                      { value: 'Skakes', label: 'Skakes' },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Kejuruan / Major</label>
                  <Select
                    value={quickMajor}
                    onChange={setQuickMajor}
                    options={quickSchool === 'Skarla'
                      ? [
                          { value: 'PPLG', label: 'PPLG' }, { value: 'TJKT 1', label: 'TJKT 1' },
                          { value: 'TJKT 2', label: 'TJKT 2' }, { value: 'DKV', label: 'DKV' },
                          { value: 'MPLB 1', label: 'MPLB 1' }, { value: 'MPLB 2', label: 'MPLB 2' },
                          { value: 'AKL', label: 'AKL' },
                        ]
                      : [
                          { value: 'FKK', label: 'FKK' }, { value: 'AKC 1', label: 'AKC 1' },
                          { value: 'AKC 2', label: 'AKC 2' }, { value: 'AKC 3', label: 'AKC 3' },
                          { value: 'AKC 4', label: 'AKC 4' }, { value: 'AKC 5', label: 'AKC 5' },
                          { value: 'AKC 6', label: 'AKC 6' }, { value: 'TLM', label: 'TLM' },
                        ]
                    }
                  />
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
            <div className="flex flex-col justify-center space-y-4 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Import Massal (CSV/Excel)</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Upload file <b>.xlsx</b> atau <b>.csv</b>. Pastikan baris pertama memiliki header: <br/>
                  <code className="text-[#4c1d95] bg-[#ddd6fe] px-1 py-0.5 rounded">Nama</code>, <code className="text-[#4c1d95] bg-[#ddd6fe] px-1 py-0.5 rounded">Kelas</code>, <code className="text-[#4c1d95] bg-[#ddd6fe] px-1 py-0.5 rounded">NIS</code>{(quickOrg === 'osis' || quickOrg === 'mpk') && <>, <code className="text-[#4c1d95] bg-[#ddd6fe] px-1 py-0.5 rounded">Jabatan</code></>}.
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
                  <><UploadCloud className="w-5 h-5 text-indigo-600" /> Pilih File Excel/CSV</>
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
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Kehadiran 7 Hari Terakhir</h3>
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
                <Bar dataKey="hadir" name="Hadir" fill="#8b5cf6" radius={[3,3,0,0]} />
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
            <Wallet className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Uang Kas 6 Bulan Terakhir</h3>
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
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `${v/1000}k` : v} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Total Kas']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2.5}
                  fill="url(#kasGrad)" dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">
              Belum ada data kas
            </div>
          )}
        </div>
      </div>

      {/* ── Gamification Leaderboard ─────────────────────────── */}
      {(orgs.includes('programming') || orgs.includes('english')) && (
        <div className="card p-5 relative overflow-hidden shadow-[0_0_20px_rgba(84,130,180,0.1)] border-t-2 border-t-[#8b5cf6]">
          {/* Glowing neon bg accents */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#ddd6fe]/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-indigo-900 to-indigo-600 text-white rounded-xl shadow-lg shadow-[#4c1d95]/15">
                <Trophy className="w-5 h-5 text-yellow-300 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Gamification Leaderboard</h3>
                <p className="text-xs text-slate-500">Peringkat 10 besar siswa dengan XP & keaktifan tertinggi</p>
              </div>
            </div>

            {/* Interactive Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              {orgs.includes('programming') && (
                <button
                  type="button"
                  onClick={() => setActiveLeaderboardTab('programming')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                    activeLeaderboardTab === 'programming'
                      ? 'bg-white text-[#4c1d95] shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Programming
                </button>
              )}
              {orgs.includes('english') && (
                <button
                  type="button"
                  onClick={() => setActiveLeaderboardTab('english')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                    activeLeaderboardTab === 'english'
                      ? 'bg-white text-[#4c1d95] shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  English Club
                </button>
              )}
            </div>
          </div>

          {/* Leaderboard content */}
          {(() => {
            const currentList = activeLeaderboardTab === 'programming'
              ? stats?.leaderboardProgramming || []
              : stats?.leaderboardEnglish || []

            if (loading) {
              return (
                <div className="py-12 flex items-center justify-center text-sm text-slate-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Memuat peringkat...
                </div>
              )
            }

            if (currentList.length === 0) {
              return (
                <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                  <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-medium">Belum ada data keaktifan siswa saat ini.</p>
                  <p className="text-xs text-slate-300 mt-0.5">Siswa akan mendapatkan +10 XP otomatis dari absensi hadir!</p>
                </div>
              )
            }

            const maxXP = Math.max(...currentList.map(s => s.xp), 100)

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {/* Podium Top 3 */}
                <div className="flex flex-col justify-center space-y-3.5 bg-gradient-to-br from-slate-50 to-[#ddd6fe]/10 border border-slate-200/60 p-4.5 rounded-2xl">
                  <div className="text-xs font-extrabold text-[#4c1d95] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-500" /> Top 3 Champions
                  </div>
                  {currentList.slice(0, 3).map((siswa, idx) => {
                    const rankStyles = [
                      {
                        bg: 'from-amber-400 to-yellow-500 shadow-yellow-400/20 text-white',
                        border: 'border-yellow-400/30',
                        medal: '🥇',
                        glow: 'shadow-[0_0_15px_rgba(234,179,8,0.25)] border-2 border-yellow-400',
                        badgeText: 'text-yellow-600 bg-yellow-50'
                      },
                      {
                        bg: 'from-slate-300 to-slate-400 shadow-slate-400/20 text-slate-900',
                        border: 'border-slate-300/30',
                        medal: '🥈',
                        glow: 'border-2 border-slate-300',
                        badgeText: 'text-slate-600 bg-slate-100'
                      },
                      {
                        bg: 'from-amber-600 to-amber-700 shadow-amber-600/20 text-white',
                        border: 'border-amber-600/30',
                        medal: '🥉',
                        glow: 'border-2 border-amber-600',
                        badgeText: 'text-amber-700 bg-amber-50'
                      }
                    ][idx] || { bg: 'bg-slate-200 text-slate-700', border: 'border-slate-200', medal: '🎗️', glow: '', badgeText: 'text-slate-500 bg-slate-50' }

                    return (
                      <div key={siswa.id} className={`flex items-center justify-between p-3 bg-white rounded-xl shadow-sm ${rankStyles.glow} transition-transform hover:-translate-y-0.5 duration-300`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-lg shadow ${rankStyles.bg}`}>
                            {rankStyles.medal}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-slate-900 leading-tight truncate">{siswa.nama}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">{siswa.kelas}</span>
                              <LevelBadge exp={siswa.xp} size="sm" />
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-sm font-black font-mono text-[#4c1d95] flex items-center gap-0.5">
                            <Zap className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400 animate-bounce" /> {siswa.xp} <span className="text-[10px] text-slate-400 font-bold font-sans uppercase">XP</span>
                          </span>
                          <span className="text-[9px] text-slate-500 font-semibold">Peringkat {idx + 1}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Rankings 4 - 10 */}
                <div className="flex flex-col space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {currentList.slice(3).map((siswa, idx) => {
                    const relativePct = Math.round((siswa.xp / maxXP) * 100)
                    return (
                      <div key={siswa.id} className="flex flex-col p-2.5 bg-white border border-slate-100 hover:border-slate-200 rounded-xl transition-all duration-300">
                        <div className="flex items-center justify-between gap-3 min-w-0 mb-1.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xs font-bold text-slate-400 font-mono w-4 text-center shrink-0">
                              #{idx + 4}
                            </span>
                            <div className="min-w-0">
                              <h4 className="text-xs font-extrabold text-slate-900 leading-tight truncate">{siswa.nama}</h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] text-slate-400 font-medium uppercase">{siswa.kelas}</span>
                                <LevelBadge exp={siswa.xp} size="sm" />
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-0.5 font-mono text-xs font-bold text-slate-700">
                            <Zap className="w-3 h-3 text-yellow-500 fill-yellow-400" /> {siswa.xp} XP
                          </div>
                        </div>
                        
                        {/* Elegant relative XP progress bar */}
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#ddd6fe] rounded-full transition-all duration-1000"
                            style={{ width: `${relativePct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Recent activity log (administrator only) */}
      {user.role === 'administrator' && (
        <div className="card p-5 min-h-[150px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Aktivitas Terbaru</h3>
            </div>
            <a href="/log" className="text-xs font-semibold text-[#4c1d95] hover:underline">Lihat semua →</a>
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

      {/* ── Request Statistics (administrator only) ─────────────────────────── */}
      {user.role === 'administrator' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Statistik Request API</h3>
            </div>
            {!loadingRequestStats && requestStats && (
              <span className="text-xs font-semibold text-slate-500">
                Total: <span className="text-slate-900 font-black">{requestStats.grandTotal.toLocaleString('id-ID')}</span> request
              </span>
            )}
          </div>

          {loadingRequestStats ? (
            <div className="py-10 flex items-center justify-center text-sm text-slate-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Memuat statistik request...
            </div>
          ) : requestStats ? (
            <div className="space-y-5">
              {/* Summary cards per aksi */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {(['CREATE','UPDATE','DELETE','LOGIN','LOGOUT'] as const).map(aksi => {
                  const meta = REQUEST_META[aksi]
                  const stat = requestStats.perAksi.find(p => p.aksi === aksi)
                  const count = stat?.count || 0
                  const pct = requestStats.grandTotal > 0 ? Math.round(count / requestStats.grandTotal * 100) : 0
                  const Icon = meta.icon
                  return (
                    <div key={aksi} className={`relative flex flex-col gap-2 p-3.5 rounded-xl border ${meta.bg} overflow-hidden`}>
                      {/* Progress bar accent */}
                      <div
                        className="absolute bottom-0 left-0 h-[3px] rounded-b-xl transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: meta.chartColor }}
                      />
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${meta.color}`}>
                          {meta.method}
                        </span>
                        <Icon className={`w-3.5 h-3.5 ${meta.color} opacity-60`} />
                      </div>
                      <div className={`text-2xl font-black font-mono leading-none ${meta.color}`}>
                        {count.toLocaleString('id-ID')}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-medium">{meta.label}</span>
                        <span className="text-[10px] font-bold text-slate-400">{pct}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* 30-day trend line chart */}
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-3">Tren 30 Hari Terakhir</p>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={requestStats.daily30} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 9, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        interval={4}
                      />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}
                        labelStyle={{ fontWeight: 700, color: '#0f172a' }}
                      />
                      <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                      {(['CREATE','UPDATE','DELETE','LOGIN','LOGOUT'] as const).map(aksi => (
                        <Line
                          key={aksi}
                          type="monotone"
                          dataKey={aksi}
                          name={REQUEST_META[aksi].label}
                          stroke={REQUEST_META[aksi].chartColor}
                          strokeWidth={1.8}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-400">Tidak ada data request</div>
          )}
        </div>
      )}

      {/* Welcome & Update Modal */}
      {showWelcomeModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          {(() => {
            // ── Type-based color config ──
            const ut = latestUpdate?.update_type || 'pengumuman'
            const modalCfg = {
              update: {
                gradientFrom: '#78350f', gradientVia: '#b45309', gradientTo: '#d97706',
                badgeBg: 'bg-yellow-50', badgeText: 'text-yellow-700',
                badgeLabel: '⚡ Update Sistem',
                iconBg: 'bg-yellow-50', iconColor: 'text-yellow-600',
                btnBg: 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-400/30',
                descLabel: 'Pembaruan & Peningkatan Fitur',
              },
              pengumuman: {
                gradientFrom: '#4c1d95', gradientVia: '#4c1d95', gradientTo: '#8b5cf6',
                badgeBg: 'bg-blue-50', badgeText: 'text-blue-700',
                badgeLabel: '📢 Pengumuman',
                iconBg: 'bg-blue-50', iconColor: 'text-[#4c1d95]',
                btnBg: 'bg-indigo-900 hover:bg-[#0f172a] shadow-[#4c1d95]/20',
                descLabel: 'Informasi Penting untuk Seluruh Admin',
              },
              perbaikan: {
                gradientFrom: '#14532d', gradientVia: '#15803d', gradientTo: '#16a34a',
                badgeBg: 'bg-green-50', badgeText: 'text-green-700',
                badgeLabel: '🔧 Perbaikan Sistem',
                iconBg: 'bg-green-50', iconColor: 'text-green-700',
                btnBg: 'bg-green-600 hover:bg-green-700 shadow-green-500/30',
                descLabel: 'Bug Fix & Peningkatan Performa',
              },
            } as const
            const cfg = modalCfg[ut as keyof typeof modalCfg] ?? modalCfg.pengumuman

            return (
              <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden relative border border-slate-100 slide-up">
                <button
                  onClick={() => setShowWelcomeModal(false)}
                  className="absolute top-4 right-4 p-2 bg-black/5 hover:bg-black/10 text-slate-400 hover:text-slate-600 rounded-full z-20 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Modal Header/Cover – dynamic color */}
                <div
                  className="h-32 relative"
                  style={{ background: `linear-gradient(135deg, ${cfg.gradientFrom}, ${cfg.gradientVia}, ${cfg.gradientTo})` }}
                >
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 2px, transparent 2px)', backgroundSize: '24px 24px' }} />
                  <div className="absolute -bottom-10 left-0 right-0 flex justify-center">
                    <div className="w-20 h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center border-4 border-white rotate-3 group hover:rotate-0 transition-transform">
                      {latestUpdate ? (
                        <div className={`w-full h-full ${cfg.iconBg} rounded-xl flex items-center justify-center`}>
                          <Megaphone className={`w-10 h-10 ${cfg.iconColor}`} />
                        </div>
                      ) : (
                        <div className="relative w-full h-full rounded-xl overflow-hidden">
                          <Image
                            src="https://uploads.onecompiler.io/43k3cj6jv/44n5t3sn5/WhatsApp%20Image%202026-05-03%20at%2011.12.38.jpeg"
                            alt="Profile"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-8 pb-8 pt-14 text-center relative">
                  {latestUpdate ? (
                    <div className="space-y-4">
                      {/* Dynamic badge */}
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${cfg.badgeBg} ${cfg.badgeText} text-[10px] font-black uppercase tracking-wider`}>
                        <Sparkles className="w-3 h-3" />{cfg.badgeLabel}
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-900 leading-tight">
                          Versi {latestUpdate.version}
                        </h2>
                        <p className="text-[#4c1d95] text-xs font-bold mt-1 opacity-70">
                          {cfg.descLabel}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-100 max-h-[160px] overflow-y-auto custom-scrollbar">
                        <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-line">
                          {latestUpdate.content}
                        </p>
                      </div>
                      <button
                        onClick={handleDismissUpdate}
                        className={`w-full py-4 px-6 ${cfg.btnBg} text-white font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2`}
                      >
                        Mulai Bekerja 🚀
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <TextType as="h2" text={`${greeting}, 👋`} className="text-2xl font-black text-slate-900 tracking-tight" typingSpeed={50} loop={false} showCursor={false} />
                        <TextType as="p" text={user.nama} className="text-[#4c1d95] font-bold mt-1 text-lg" typingSpeed={60} initialDelay={800} loop={false} cursorClassName="text-[#4c1d95]" />
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed">
                        Selamat datang kembali! Pantau terus perkembangan dan aktivitas terbaru hari ini.
                      </p>
                      <button
                        onClick={() => setShowWelcomeModal(false)}
                        className="w-full py-4 px-6 bg-indigo-900 hover:bg-[#0f172a] text-white font-bold rounded-2xl shadow-lg shadow-[#4c1d95]/20 transition-all active:scale-[0.98]"
                      >
                        Mulai Bekerja 🚀
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
        </div>,
        document.body
      )}
    </div>
  )
}
