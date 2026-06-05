'use client'

import { useState, useEffect } from 'react'
import { Megaphone, History, Save, PlusCircle, Loader2, Info, CheckCircle2, Trash2, Zap, Bell, Wrench } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDateTime } from '@/lib/utils'

interface Props {
  user: { id: number; nama: string; email: string; role: string }
}

type UpdateType = 'update' | 'pengumuman' | 'perbaikan'

interface Update {
  id: number
  version: string
  content: string
  update_type: UpdateType
  created_at: string
  creator?: { nama: string }
}

// ─── Type config (color palette per type) ─────────────────────────────────────
const TYPE_CONFIG: Record<UpdateType, {
  label: string
  description: string
  icon: React.ReactNode
  badgeBg: string
  badgeText: string
  ring: string
  cardBorder: string
  cardBg: string
  dot: string
}> = {
  update: {
    label: 'Update',
    description: 'Pembaruan fitur atau versi baru sistem',
    icon: <Zap className="w-4 h-4" />,
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-700',
    ring: 'ring-yellow-400',
    cardBorder: 'border-yellow-200',
    cardBg: 'bg-yellow-50/60',
    dot: 'bg-yellow-400',
  },
  pengumuman: {
    label: 'Pengumuman',
    description: 'Informasi penting untuk seluruh admin',
    icon: <Bell className="w-4 h-4" />,
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    ring: 'ring-blue-400',
    cardBorder: 'border-blue-200',
    cardBg: 'bg-blue-50/60',
    dot: 'bg-blue-500',
  },
  perbaikan: {
    label: 'Perbaikan',
    description: 'Bug fix atau perbaikan performa sistem',
    icon: <Wrench className="w-4 h-4" />,
    badgeBg: 'bg-green-100',
    badgeText: 'text-green-700',
    ring: 'ring-green-400',
    cardBorder: 'border-green-200',
    cardBg: 'bg-green-50/60',
    dot: 'bg-green-500',
  },
}

export default function UpdateSistemClient({ user }: Props) {
  const [version, setVersion] = useState('')
  const [content, setContent] = useState('')
  const [updateType, setUpdateType] = useState<UpdateType>('update')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<Update[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  async function fetchHistory() {
    try {
      const res = await fetch('/api/system-update')
      let data: any = null
      try {
        data = await res.json()
      } catch {
        console.error('Failed to parse system-update history response', res.status, res.statusText)
      }
      if (res.ok && data?.latestUpdate) {
        setHistory([data.latestUpdate])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingHistory(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!version || !content) return toast.error('Lengkapi data pembaruan')

    setLoading(true)
    try {
      const res = await fetch('/api/system-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version, content, update_type: updateType })
      })
      let data: any = null
      try {
        data = await res.json()
      } catch {
        console.error('Failed to parse system-update submit response', res.status, res.statusText)
        throw new Error(res.status > 0 ? `Server error ${res.status} — periksa log server` : 'Tidak dapat terhubung ke server')
      }
      if (res.ok) {
        toast.success('Pembaruan sistem berhasil diposting!')
        setVersion('')
        setContent('')
        setUpdateType('update')
        fetchHistory()
      } else {
        toast.error(data?.error || 'Pembaruan gagal dipost')
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleClearHistory() {
    if (!window.confirm('Apakah Anda yakin ingin menghapus seluruh riwayat update? Notifikasi di dashboard admin lain juga akan hilang.')) return

    setLoadingHistory(true)
    try {
      const res = await fetch('/api/system-update', { method: 'DELETE' })
      if (res.ok) {
        toast.success('Riwayat update berhasil dibersihkan')
        setHistory([])
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal membersihkan riwayat')
      }
    } catch (e) {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setLoadingHistory(false)
    }
  }

  const selectedCfg = TYPE_CONFIG[updateType]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#001F3F] to-[#1E90FF] rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-full opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
            <Megaphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black">Manajemen Pembaruan Sistem</h2>
            <p className="text-blue-100 text-sm mt-0.5">Kirim notifikasi update patch dan versi ke seluruh Admin Organisasi.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Post Update */}
        <div className="lg:col-span-2 space-y-5">

          {/* ── Tipe Notifikasi Selector ── */}
          <div className="card p-5 shadow-sm border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-5 rounded-full bg-[#1E90FF]" />
              <h3 className="text-sm font-bold text-[#001F3F]">Tipe Notifikasi</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(TYPE_CONFIG) as [UpdateType, typeof TYPE_CONFIG[UpdateType]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setUpdateType(key)}
                  className={`
                    relative flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all duration-200 text-center
                    ${updateType === key
                      ? `${cfg.cardBorder} ${cfg.cardBg} ring-2 ${cfg.ring} ring-offset-1 shadow-sm`
                      : 'border-white/10 bg-deep-navy hover:border-slate-300 hover:bg-white/5'
                    }
                  `}
                >
                  {/* Color dot indicator */}
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot} ${updateType === key ? 'scale-125' : ''} transition-transform`} />

                  {/* Icon */}
                  <span className={`${updateType === key ? cfg.badgeText : 'text-slate-400'} transition-colors`}>
                    {cfg.icon}
                  </span>

                  {/* Label */}
                  <span className={`text-xs font-bold leading-none ${updateType === key ? cfg.badgeText : 'text-slate-400'} transition-colors`}>
                    {cfg.label}
                  </span>

                  {/* Active checkmark */}
                  {updateType === key && (
                    <span className={`absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center ${cfg.badgeBg}`}>
                      <CheckCircle2 className={`w-3 h-3 ${cfg.badgeText}`} />
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Selected type description */}
            <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg ${selectedCfg.cardBg} border ${selectedCfg.cardBorder}`}>
              <span className={`${selectedCfg.badgeText}`}>{selectedCfg.icon}</span>
              <p className={`text-xs font-medium ${selectedCfg.badgeText}`}>{selectedCfg.description}</p>
            </div>
          </div>

          {/* ── Form Input ── */}
          <div className={`card p-6 shadow-sm border-2 transition-colors duration-300 ${selectedCfg.cardBorder}`}>
            <div className="flex items-center gap-2 mb-6">
              <PlusCircle className={`w-5 h-5 ${selectedCfg.badgeText}`} />
              <h3 className="text-lg font-bold text-[#001F3F]">Buat Update Baru</h3>
              <span className={`ml-auto text-[10px] font-black px-2.5 py-0.5 rounded-full ${selectedCfg.badgeBg} ${selectedCfg.badgeText} uppercase tracking-wide`}>
                {selectedCfg.label}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="form-group">
                <label className="label">Versi / Patch</label>
                <div className="relative">
                  <input
                    type="text"
                    value={version}
                    onChange={e => setVersion(e.target.value)}
                    className="input pl-10"
                    placeholder="Contoh: V 17.6.0 atau Patch 1.2"
                    required
                  />
                  <Info className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Gunakan format yang konsisten agar mudah dikenali.</p>
              </div>

              <div className="form-group">
                <label className="label">Detail Pembaruan</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="input min-h-[160px] py-3 resize-none"
                  placeholder="Tuliskan apa saja yang baru, perbaikan bug, atau peningkatan performa..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3.5 text-base font-bold shadow-md shadow-[#001F3F]/20"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <><Save className="w-5 h-5" /> Publikasikan Sekarang</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ── Sidebar: History + Tips ── */}
        <div className="space-y-5">
          {/* Legenda Warna */}
          <div className="card p-4 border border-white/10 shadow-sm">
            <h4 className="text-xs font-bold text-[#001F3F] mb-3">Legenda Tipe Notifikasi</h4>
            <div className="space-y-2">
              {(Object.entries(TYPE_CONFIG) as [UpdateType, typeof TYPE_CONFIG[UpdateType]][]).map(([key, cfg]) => (
                <div key={key} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${cfg.cardBg} border ${cfg.cardBorder}`}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  <span className={`text-xs font-bold ${cfg.badgeText}`}>{cfg.label}</span>
                  <span className="text-[10px] text-slate-400 leading-tight">{cfg.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* History */}
          <div className="card p-5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#1E90FF]" />
                <h3 className="text-sm font-bold text-[#001F3F]">Riwayat Terbaru</h3>
              </div>
              {history.length > 0 && user.role === 'administrator' && (
                <button
                  onClick={handleClearHistory}
                  className="text-[10px] flex items-center gap-1 text-red-500 hover:text-red-700 font-bold transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Bersihkan
                </button>
              )}
            </div>

            {loadingHistory ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs">Memuat riwayat...</span>
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-4">
                {history.map(upd => {
                  const t = upd.update_type || 'update'
                  const cfg = TYPE_CONFIG[t] ?? TYPE_CONFIG.update
                  return (
                    <div key={upd.id} className={`p-4 rounded-xl border-2 transition-colors ${cfg.cardBg} ${cfg.cardBorder}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText} uppercase tracking-wide`}>
                            {cfg.label}
                          </span>
                        </div>
                        <span className={`text-xs font-black px-2 py-0.5 rounded ${cfg.badgeBg} ${cfg.badgeText}`}>
                          {upd.version}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-3 mb-2 leading-relaxed">
                        {upd.content}
                      </p>
                      <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatDateTime(upd.created_at)}
                        </span>
                        <span className={`text-[10px] font-bold ${cfg.badgeText}`}>
                          Oleh: {upd.creator?.nama || 'Admin'}
                        </span>
                      </div>
                    </div>
                  )
                })}
                {history.length === 1 && (
                  <p className="text-[10px] text-center text-slate-400 italic mt-2">
                    Menampilkan update terakhir.
                  </p>
                )}
              </div>
            ) : (
              <div className="py-10 text-center">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                  <History className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-xs text-slate-400">Belum ada riwayat update.</p>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Tips Administrator
            </h4>
            <p className="text-[11px] text-blue-700 leading-relaxed">
              Setiap kali Anda memposting update, seluruh admin organisasi (OSIS, MPK, Programming, English Club) akan melihat popup notifikasi saat mereka masuk ke Dashboard. Gunakan tipe yang sesuai agar mudah dibedakan.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
