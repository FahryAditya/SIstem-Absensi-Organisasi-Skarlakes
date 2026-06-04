'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, Flame, CheckCircle2, TrendingUp, Calendar, ChevronDown, ChevronUp, ArrowLeft, Loader2 } from 'lucide-react'
import { getAccessibleOrgs } from '@/lib/auth-shared'

interface RekapData {
  id: number
  nama: string
  kelas?: string | null
  jabatan?: string | null
  xp: number
  level: number
  hadirBulanIni: number
  totalBulanIni: number
  persentaseKehadiran: number
  streak: number
  grafik: { bulan: string; hadir: number; total: number; persen: number }[]
  riwayat: { tanggal: string; status: string }[]
}

const STATUS_COLORS: Record<string, string> = {
  hadir: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  tidak_hadir: 'bg-red-500/20 text-red-400 border-red-500/30',
  izin: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  sakit: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  kas_saja: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

const ORG_TABS = [
  { key: 'siswa', ekskul: 'programming', label: 'Programming', color: 'from-blue-500 to-cyan-500' },
  { key: 'siswa', ekskul: 'english', label: 'English Club', color: 'from-emerald-500 to-teal-500' },
  { key: 'osis', ekskul: 'osis', label: 'OSIS', color: 'from-purple-500 to-violet-500' },
  { key: 'mpk', ekskul: 'mpk', label: 'MPK', color: 'from-orange-500 to-amber-500' },
]

export default function RekapAbsensiPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [accessibleOrgs, setAccessibleOrgs] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState(0)
  const [members, setMembers] = useState<{ id: number; nama: string; kelas?: string | null }[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [rekap, setRekap] = useState<RekapData | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  const [showRiwayat, setShowRiwayat] = useState(false)

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me')
        const json = await res.json()
        if (json.user) {
          setUser(json.user)
          const orgs = getAccessibleOrgs(json.user.role)
          setAccessibleOrgs(orgs)
          // Find first tab that is accessible
          const firstIdx = ORG_TABS.findIndex(t => orgs.includes(t.ekskul))
          if (firstIdx !== -1) setActiveTab(firstIdx)
        } else {
          router.push('/login')
        }
      } catch {
        router.push('/login')
      } finally {
        setAuthLoading(false)
      }
    }
    fetchUser()
  }, [router])

  const filteredTabs = ORG_TABS.filter(t => accessibleOrgs.includes(t.ekskul))
  const tab = ORG_TABS[activeTab]

  // Fetch list anggota
  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true)
    setSelectedId(null)
    setRekap(null)
    try {
      let url = ''
      if (tab.key === 'siswa') url = `/api/siswa?ekskul=${tab.ekskul}&limit=100`
      else if (tab.key === 'osis') url = `/api/organisasi?tipe=osis&limit=100`
      else url = `/api/organisasi?tipe=mpk&limit=100`
      const res = await fetch(url)
      const json = await res.json()
      setMembers(json.data || [])
    } catch { setMembers([]) }
    finally { setLoadingMembers(false) }
  }, [tab.key, tab.ekskul])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  async function fetchRekap(id: number) {
    setSelectedId(id)
    setLoading(true)
    setRekap(null)
    try {
      const params = new URLSearchParams({ id: id.toString(), tipe: tab.key })
      if (tab.key === 'siswa') params.set('ekskul', tab.ekskul)
      const res = await fetch(`/api/absensi/rekap?${params}`)
      const json = await res.json()
      setRekap(json.data || null)
    } catch { setRekap(null) }
    finally { setLoading(false) }
  }

  if (authLoading) return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f1117] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        </div>
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h1 className="text-2xl font-bold">Rekap Absensi</h1>
          </div>
          <p className="text-slate-400 text-sm">Statistik kehadiran, streak, dan grafik per anggota</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {filteredTabs.map((t) => {
            const idx = ORG_TABS.indexOf(t)
            return (
              <button key={idx} onClick={() => setActiveTab(idx)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${activeTab === idx ? `bg-gradient-to-r ${t.color} text-white border-transparent` : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
                {t.label}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Member List */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-3 border-b border-white/5">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Pilih Anggota</p>
            </div>
            <div className="overflow-y-auto max-h-[500px]">
              {loadingMembers ? (
                <div className="space-y-2 p-3">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />)}</div>
              ) : members.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-8">Tidak ada anggota</p>
              ) : (
                <div className="p-2 space-y-1">
                  {members.map((m) => (
                    <button key={m.id} onClick={() => fetchRekap(m.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${selectedId === m.id ? `bg-gradient-to-r ${tab.color} text-white` : 'text-slate-300 hover:bg-white/5'}`}>
                      <div className="font-medium truncate">{m.nama}</div>
                      {m.kelas && <div className="text-xs opacity-70">{m.kelas}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Rekap Detail */}
          <div className="md:col-span-2 space-y-4">
            {!selectedId ? (
              <div className="h-full flex items-center justify-center text-slate-500 bg-white/5 border border-white/10 rounded-2xl py-20">
                <div className="text-center">
                  <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Pilih anggota untuk melihat rekap</p>
                </div>
              </div>
            ) : loading ? (
              <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />)}</div>
            ) : rekap ? (
              <>
                {/* Nama & Level */}
                <div className={`rounded-2xl p-5 bg-gradient-to-br ${tab.color} bg-opacity-10 border border-white/10`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{rekap.nama}</h2>
                      <p className="text-sm opacity-80">{tab.label} • {rekap.kelas}{rekap.jabatan ? ` • ${rekap.jabatan}` : ''}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{rekap.xp} EXP</div>
                      <div className="text-sm opacity-80">Level {rekap.level}</div>
                    </div>
                  </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-emerald-400">{rekap.hadirBulanIni}</div>
                    <div className="text-xs text-slate-400">Hadir Bulan Ini</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <TrendingUp className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-blue-400">{rekap.persentaseKehadiran}%</div>
                    <div className="text-xs text-slate-400">Persentase</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-orange-400">{rekap.streak}</div>
                    <div className="text-xs text-slate-400">Streak 🔥</div>
                  </div>
                </div>

                {/* Grafik 6 Bulan */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-slate-300 mb-4">Kehadiran 6 Bulan Terakhir</h3>
                  <div className="flex items-end gap-2 h-28">
                    {rekap.grafik.map((g) => (
                      <div key={g.bulan} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] text-slate-500">{g.persen}%</span>
                        <div className="w-full rounded-t-md relative bg-white/5" style={{ height: '80px' }}>
                          <div
                            className={`absolute bottom-0 w-full rounded-t-md bg-gradient-to-t ${tab.color} transition-all duration-700`}
                            style={{ height: `${Math.max(4, g.persen)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500">{g.bulan.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Riwayat Absensi */}
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <button onClick={() => setShowRiwayat(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5 transition">
                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Riwayat Absensi ({rekap.riwayat.length})</span>
                    {showRiwayat ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showRiwayat && (
                    <div className="border-t border-white/5 max-h-64 overflow-y-auto">
                      {rekap.riwayat.length === 0 ? (
                        <p className="text-center text-slate-500 py-6 text-sm">Belum ada riwayat</p>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {[...rekap.riwayat].reverse().map((r, i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-2.5">
                              <span className="text-sm text-slate-300">{new Date(r.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[r.status] ?? STATUS_COLORS['hadir']}`}>{r.status.replace('_', ' ')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-slate-500 bg-white/5 border border-white/10 rounded-2xl">
                Gagal memuat data rekap
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
