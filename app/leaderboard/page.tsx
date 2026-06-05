'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Medal, Star, TrendingUp, Users, Crown, ArrowLeft } from 'lucide-react'
import { pusherClient } from '@/lib/pusher-client'

interface LeaderboardEntry {
  id: number
  nama: string
  kelas: string | null
  jabatan: string | null
  foto_url: string | null
  xp: number
  level: number
  rank: number
  levelName: string
  progress: {
    expSaatIni: number
    expUntukLevel: number | null
    persen: number
    levelName: string
    nextLevelName: string | null
  }
}

const TABS = [
  { key: 'programming', label: 'Programming', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10 border-blue-500/30' },
  { key: 'english', label: 'English Club', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  { key: 'osis', label: 'OSIS', color: 'from-purple-500 to-persian-blue/100', bg: 'bg-purple-500/10 border-purple-500/30' },
  { key: 'mpk', label: 'MPK', color: 'from-orange-500 to-amber-500', bg: 'bg-orange-500/10 border-orange-500/30' },
]

const RANK_STYLES = [
  { border: 'border-yellow-400/60', bg: 'bg-yellow-400/10', icon: <Crown className="w-5 h-5 text-yellow-400" />, text: 'text-yellow-400', medal: '🥇' },
  { border: 'border-gray-300/60', bg: 'bg-gray-300/10', icon: <Medal className="w-5 h-5 text-gray-300" />, text: 'text-gray-300', medal: '🥈' },
  { border: 'border-amber-600/60', bg: 'bg-amber-600/10', icon: <Medal className="w-5 h-5 text-amber-600" />, text: 'text-amber-600', medal: '🥉' },
]

const LEVEL_COLORS: Record<string, string> = {
  'Beginner': 'bg-white/50/20 text-slate-300 border-slate-500/30',
  'Intermediate': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Advanced': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Expert': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Master': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('programming')
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeaderboard = useCallback(async (org: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leaderboard?organisasi=${org}&limit=10`)
      const json = await res.json()
      setData(json.data || [])
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLeaderboard(activeTab) }, [activeTab, fetchLeaderboard])

  useEffect(() => {
    const client = pusherClient
    if (!client) return
    const channel = client.subscribe('leaderboard')
    const refresh = (event: { organisasi?: string }) => {
      if (!event.organisasi || event.organisasi === activeTab) {
        fetchLeaderboard(activeTab)
      }
    }
    channel.bind('xp-updated', refresh)
    return () => {
      channel.unbind('xp-updated', refresh)
      client.unsubscribe('leaderboard')
    }
  }, [activeTab, fetchLeaderboard])

  const top3 = data.slice(0, 3)
  const rest = data.slice(3)
  const activeTabInfo = TABS.find(t => t.key === activeTab)!

  const renderAvatar = (entry: LeaderboardEntry, sizeClass: string, textClass: string) => (
    entry.foto_url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={entry.foto_url} alt={entry.nama} className={`${sizeClass} rounded-full object-cover border border-white/20 mx-auto`} />
    ) : (
      <div className={`${sizeClass} rounded-full flex items-center justify-center font-bold bg-gradient-to-br ${activeTabInfo.color} ${textClass}`}>
        {entry.nama.charAt(0).toUpperCase()}
      </div>
    )
  )

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
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

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                activeTab === tab.key
                  ? `bg-gradient-to-r ${tab.color} text-white border-transparent shadow-lg scale-105`
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Belum ada data anggota</p>
          </div>
        ) : (
          <>
            {/* TOP 3 Champions */}
            {top3.length > 0 && (
              <div className="flex flex-col md:grid md:grid-cols-3 gap-6 md:gap-4 mb-10">
                {top3.map((entry) => {
                  const realRank = entry.rank - 1 // 0-indexed (0, 1, 2)
                  const style = RANK_STYLES[realRank]
                  const isFirst = realRank === 0
                  
                  // Order for podium: Rank 2 (order-1), Rank 1 (order-2), Rank 3 (order-3)
                  // On mobile, they should follow natural rank order: 1, 2, 3
                  const orderClass = realRank === 0 ? 'order-1 md:order-2' : 
                                    realRank === 1 ? 'order-2 md:order-1' : 'order-3'

                  return (
                    <div
                      key={entry.id}
                      className={`relative rounded-2xl border p-6 text-center transition-all duration-300 hover:-translate-y-1 ${style.border} ${style.bg} ${isFirst ? 'md:-mt-4 shadow-2xl scale-105 md:scale-110 z-10' : ''} ${orderClass}`}
                    >
                      <div className="text-3xl mb-3">{style.medal}</div>
                      <div className="mb-4">{renderAvatar(entry, 'w-16 h-16', 'text-2xl')}</div>
                      <div className="font-bold text-white truncate text-base mb-1">{entry.nama}</div>
                      <div className="text-xs text-slate-400 mb-3">{entry.kelas} {entry.jabatan ? `• ${entry.jabatan}` : ''}</div>
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border mb-4 ${LEVEL_COLORS[entry.levelName] ?? LEVEL_COLORS['Beginner']}`}>
                        Lv{entry.level} {entry.levelName}
                      </span>
                      <div className={`text-2xl font-black ${style.text} mb-1`}>{entry.xp.toLocaleString()} <span className="text-xs font-medium opacity-70">EXP</span></div>
                      {/* Progress bar */}
                      <div className="mt-4">
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${activeTabInfo.color} rounded-full transition-all duration-700`}
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

            {/* Rank #4 - #10 */}
            {rest.length > 0 && (
              <div className="space-y-3">
                {rest.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 rounded-xl border p-4 transition-all hover:bg-white/5 ${activeTabInfo.bg}`}
                  >
                    <div className="w-8 text-center">
                      <span className="text-lg font-bold text-slate-400">#{entry.rank}</span>
                    </div>
                    <div className="shrink-0">{renderAvatar(entry, 'w-10 h-10', 'text-sm')}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white truncate">{entry.nama}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${LEVEL_COLORS[entry.levelName] ?? LEVEL_COLORS['Beginner']}`}>
                          Lv{entry.level}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">{entry.kelas}</div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${activeTabInfo.color} rounded-full transition-all duration-500`}
                            style={{ width: `${entry.progress.persen}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">{entry.progress.persen}%</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 justify-end">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-semibold text-emerald-400">{entry.xp.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-slate-400">EXP</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
