'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDate, formatDateTime, ORG_LABELS, OrgType } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/auth-shared'
import { Users, CheckCircle2, Wallet, TrendingUp, Activity, Loader2, Clock } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, AreaChart, Area
} from 'recharts'

interface Props {
  user: { id: number; nama: string; email: string; role: string }
}

interface Stats {
  totalSiswa: number
  totalOsis: number
  totalMpk: number
  hadirHariIni: number
  totalKas: number
  kehadiranMingguan: { day: string; hadir: number; tidak_hadir: number }[]
  kasPerBulan: { bulan: string; total: number }[]
  recentLog: { id: number; user_nama: string; deskripsi: string; created_at: string; aksi: string }[]
  orgs: string[]
}

const AKSI_COLORS: Record<string, string> = {
  CREATE: 'text-green-600 bg-green-50',
  UPDATE: 'text-blue-600 bg-blue-50',
  DELETE: 'text-red-600 bg-red-50',
  LOGIN:  'text-violet-600 bg-violet-50',
  LOGOUT: 'text-slate-600 bg-slate-100',
}

export default function DashboardClient({ user }: Props) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [now] = useState(new Date())

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const greetingHour = now.getHours()
  const greeting = greetingHour < 11 ? 'Selamat pagi' : greetingHour < 15 ? 'Selamat siang' : greetingHour < 18 ? 'Selamat sore' : 'Selamat malam'

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-slate-400">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">Memuat dashboard...</span>
    </div>
  )

  const orgs = stats?.orgs || []

  const statCards = [
    orgs.some(o => ['programming', 'english'].includes(o)) && {
      label: 'Total Siswa Ekskul',
      value: stats?.totalSiswa ?? 0,
      suffix: 'siswa',
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600',
    },
    orgs.includes('osis') && {
      label: 'Anggota OSIS',
      value: stats?.totalOsis ?? 0,
      suffix: 'anggota',
      icon: Users,
      color: 'bg-violet-50 text-violet-600',
    },
    orgs.includes('mpk') && {
      label: 'Anggota MPK',
      value: stats?.totalMpk ?? 0,
      suffix: 'anggota',
      icon: Users,
      color: 'bg-orange-50 text-orange-600',
    },
    {
      label: 'Hadir Hari Ini',
      value: stats?.hadirHariIni ?? 0,
      suffix: 'orang',
      icon: CheckCircle2,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Total Uang Kas',
      value: formatCurrency(stats?.totalKas ?? 0),
      isCurrency: true,
      icon: Wallet,
      color: 'bg-amber-50 text-amber-600',
    },
  ].filter(Boolean) as { label: string; value: number | string; suffix?: string; isCurrency?: boolean; icon: React.ElementType; color: string }[]

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative">
          <p className="text-indigo-200 text-sm font-medium">{greeting}, 👋</p>
          <h2 className="text-2xl font-black mt-0.5">{user.nama}</h2>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">
              {ROLE_LABELS[user.role] || user.role}
            </span>
            <span className="text-xs text-indigo-300 flex items-center gap-1">
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
              <div className="text-xs text-slate-500 font-semibold leading-tight">{s.label}</div>
              <div className="text-xl font-black text-slate-800 mt-1 font-mono leading-none">
                {s.isCurrency ? s.value : `${s.value}`}
              </div>
              {s.suffix && <div className="text-[10px] text-slate-400 mt-0.5">{s.suffix}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Kehadiran mingguan */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-700">Kehadiran 7 Hari Terakhir</h3>
          </div>
          {stats?.kehadiranMingguan && stats.kehadiranMingguan.some(d => d.hadir + d.tidak_hadir > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.kehadiranMingguan} barSize={14} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="hadir" name="Hadir" fill="#6366f1" radius={[3,3,0,0]} />
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
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-700">Uang Kas 6 Bulan Terakhir</h3>
          </div>
          {stats?.kasPerBulan && stats.kasPerBulan.some(d => d.total > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.kasPerBulan}>
                <defs>
                  <linearGradient id="kasGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Total Kas']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2.5}
                  fill="url(#kasGrad)" dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} />
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
      {user.role === 'administrator' && stats?.recentLog && stats.recentLog.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-700">Aktivitas Terbaru</h3>
            </div>
            <a href="/log" className="text-xs font-semibold text-indigo-600 hover:underline">Lihat semua →</a>
          </div>
          <div className="space-y-2">
            {stats.recentLog.map(log => (
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
        </div>
      )}
    </div>
  )
}
