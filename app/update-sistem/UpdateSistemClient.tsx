'use client'

import { useState, useEffect } from 'react'
import { Megaphone, History, Save, PlusCircle, Loader2, Info, CheckCircle2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDateTime } from '@/lib/utils'

interface Props {
  user: { id: number; nama: string; email: string; role: string }
}

interface Update {
  id: number
  version: string
  content: string
  created_at: string
  creator?: { nama: string }
}

export default function UpdateSistemClient({ user }: Props) {
  const [version, setVersion] = useState('')
  const [content, setContent] = useState('')
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
        body: JSON.stringify({ version, content })
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Info */}
      <div className="bg-gradient-to-br from-[#052659] to-[#5482B4] rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
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
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-6">
              <PlusCircle className="w-5 h-5 text-[#5482B4]" />
              <h3 className="text-lg font-bold text-[#011025]">Buat Update Baru</h3>
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
                  className="input min-h-[180px] py-3 resize-none" 
                  placeholder="Tuliskan apa saja yang baru, perbaikan bug, atau peningkatan performa..."
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary w-full justify-center py-3.5 text-base font-bold shadow-md shadow-[#052659]/20"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <><Save className="w-5 h-5" /> Publikasikan Sekarang</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Recent Updates History */}
        <div className="space-y-6">
          <div className="card p-5 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#5482B4]" />
                <h3 className="text-sm font-bold text-[#011025]">Riwayat Terbaru</h3>
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
                {history.map(upd => (
                  <div key={upd.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                        {upd.version}
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-3 mb-2 leading-relaxed">
                      {upd.content}
                    </p>
                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatDateTime(upd.created_at)}
                      </span>
                      <span className="text-[10px] text-blue-600 font-bold">
                        Oleh: {upd.creator?.nama || 'Admin'}
                      </span>
                    </div>
                  </div>
                ))}
                {history.length === 1 && (
                  <p className="text-[10px] text-center text-slate-400 italic mt-2">
                    Menampilkan update terakhir.
                  </p>
                )}
              </div>
            ) : (
              <div className="py-10 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <History className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-xs text-slate-400">Belum ada riwayat update.</p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Tips Administrator
            </h4>
            <p className="text-[11px] text-blue-700 leading-relaxed">
              Setiap kali Anda memposting update, seluruh admin organisasi akan melihat popup notifikasi saat mereka masuk ke Dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
