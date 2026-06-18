'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Medal, TrendingUp, Users, Crown, ArrowLeft, Building2, Loader2 } from 'lucide-react'
import { pusherClient } from '@/lib/pusher-client'

interface LeaderboardEntry {
  id: number
  nama: string
  kelas: string | null
  jabatan: string | null
  xp: number
  level: number
  rank: number
  levelName: string
  organization: string
  progress: {
    expSaatIni: number
    expUntukLevel: number | null
    persen: number
    levelName: string
    nextLevelName: string | null
  }
}

interface Organization {
  id: number
  nama: string
  slug: string
  category: string
}

const RANK_STYLES = [
  { border: 'border-yellow-400/60', bg: 'bg-yellow-400/10', text: 'text-yellow-400', medal: '🥇' },
  { border: 'border-gray-300/60', bg: 'bg-gray-300/10', text: 'text-gray-300', medal: '🥈' },
  { border: 'border-amber-600/60', bg: 'bg-amber-600/10', text: 'text-amber-600', medal: '🥉' },
]

const LEVEL_COLORS: Record<string, string> = {
  'Beginner': 'bg-white/10 text-slate-200 border-slate-500/30',
  'Intermediate': 'bg-blue-500/20 text-blue-200 border-blue-500/30',
  'Advanced': 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
  'Expert': 'bg-purple-500/20 text-purple-200 border-purple-500/30',
  'Master': 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [activeOrgId, setActiveOrgId] = useState<number | null>(null)
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [orgsLoading, setOrgsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/organizations')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data.length > 0) {
          setOrgs(json.data)
          setActiveOrgId(json.data[0].id)
        }
        setOrgsLoading(false)
      })
      .catch(() => setOrgsLoading(false))
  }, [])

  const fetchLeaderboard = useCallback(async (orgId: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leaderboard?orgId=${orgId}&limit=10`)
      const json = await res.json()
      setData(json.data || [])
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { 
    if (activeOrgId) fetchLeaderboard(activeOrgId) 
  }, [activeOrgId, fetchLeaderboard])

  useEffect(() => {
    const client = pusherClient
    if (!client) return
    const channel = client.subscribe('leaderboard')
    const refresh = (event: { organizationId?: number }) => {
      if (!event.organizationId || event.organizationId === activeOrgId) {
        if (activeOrgId) fetchLeaderboard(activeOrgId)
      }
    }
    channel.bind('xp-updated', refresh)
    return () => {
      channel.unbind('xp-updated', refresh)
      client.unsubscribe('leaderboard')
    }
  }, [activeOrgId, fetchLeaderboard])

  const top3 = data.slice(0, 3)
  const rest = data.slice(3)
  const activeOrg = orgs.find(o => o.id === activeOrgId)

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        </div>
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-1.5 mb-4">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-300 text-sm font-medium">Leaderboard</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
            Hall of Fame
          </h1>
          <p className="text-slate-400 mt-2">Ranking EXP anggota terbaik per organisasi</p>
        </div>

        {/* Dynamic Tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {orgsLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          ) : (
            orgs.map(org => (
              <button
                key={org.id}
                onClick={() => setActiveOrgId(org.id)}
                className={`px-5 py-2 rounded-full text-sm font-bold border transition-all duration-200 ${
                  activeOrgId === org.id
                    ? `bg-persian-blue text-white border-transparent shadow-lg scale-105`
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                {org.nama}
              </button>
            ))
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 text-slate-400 bg-white/5 rounded-[2rem] border border-white/10">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-bold">Belum ada data anggota</p>
            <p className="text-xs mt-1">Organisasi ini mungkin belum memiliki anggota aktif.</p>
          </div>
        ) : (
          <>
            {top3.length > 0 && (
              <div className="flex flex-col md:grid md:grid-cols-3 gap-6 md:gap-4 mb-10">
                {top3.map((entry) => {
                  const realRank = entry.rank - 1
                  const style = RANK_STYLES[realRank]
                  const isFirst = realRank === 0
                  const orderClass = realRank === 0 ? 'order-1 md:order-2' : 
                                    realRank === 1 ? 'order-2 md:order-1' : 'order-3'

                  return (
                    <div
                      key={entry.id}
                      className={`relative rounded-[2rem] border p-6 text-center transition-all duration-300 hover:-translate-y-1 ${style.border} ${style.bg} ${isFirst ? 'md:-mt-4 shadow-2xl scale-105 md:scale-110 z-10' : ''} ${orderClass}`}
                    >
                      <div className="text-3xl mb-3">{style.medal}</div>
                      <div className="mb-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black bg-persian-blue text-white shadow-inner mx-auto text-2xl`}>
                          {entry.nama.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="font-bold text-white truncate text-base mb-1">{entry.nama}</div>
                      <div className="text-xs text-slate-400 mb-3">{entry.kelas} {entry.jabatan ? `• ${entry.jabatan}` : ''}</div>
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border mb-4 font-bold ${LEVEL_COLORS[entry.levelName] ?? LEVEL_COLORS['Beginner']}`}>
                        Lv{entry.level} {entry.levelName}
                      </span>
                      <div className={`text-2xl font-black ${style.text} mb-1`}>{entry.xp.toLocaleString()} <span className="text-xs font-medium opacity-70">EXP</span></div>
                      <div className="mt-4">
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-persian-blue rounded-full transition-all duration-700`}
                            style={{ width: `${entry.progress.persen}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">{entry.progress.persen}% ke {entry.progress.nextLevelName ?? 'Max'}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="space-y-3">
              {rest.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 rounded-2xl border p-4 transition-all hover:bg-white/5 bg-white/[0.02] border-white/5`}
                >
                  <div className="w-8 text-center">
                    <span className="text-lg font-bold text-slate-400">#{entry.rank}</span>
                  </div>
                  <div className="shrink-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-white/5 text-white border border-white/10 text-sm">
                      {entry.nama.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white truncate">{entry.nama}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${LEVEL_COLORS[entry.levelName] ?? LEVEL_COLORS['Beginner']}`}>
                        Lv{entry.level}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">{entry.kelas}</div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-persian-blue rounded-full transition-all duration-500`}
                          style={{ width: `${entry.progress.persen}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">{entry.progress.persen}%</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-bold text-emerald-400">{entry.xp.toLocaleString()}</span>
                    </div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">EXP</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
