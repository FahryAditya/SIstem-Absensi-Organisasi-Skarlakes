'use client'

import { useEffect, useState, useCallback } from 'react'
import { Zap, Search, Plus, Minus, Send, History } from 'lucide-react'
import { SessionUser } from '@/lib/auth'

interface AdminExpClientProps {
  user: SessionUser
}

interface Member {
  id: number
  nama: string
  kelas: string | null
  jabatan?: string | null
  xp: number
  level: number
  tipe_anggota: 'siswa' | 'anggota_osis' | 'anggota_mpk'
}

interface ExpLog {
  id: number
  tipe_anggota: string
  siswa_id: number | null
  anggota_osis_id: number | null
  anggota_mpk_id: number | null
  selisih: number
  alasan: string
  organisasi: string
  created_at: string
}

const ORG_OPTIONS = [
  { id: 'programming', label: 'Programming', role: ['administrator', 'admin_programming'] },
  { id: 'english', label: 'English Club', role: ['administrator', 'admin_english'] },
  { id: 'osis', label: 'OSIS', role: ['administrator', 'admin_osis_mpk'] },
  { id: 'mpk', label: 'MPK', role: ['administrator', 'admin_osis_mpk'] },
]

export default function AdminExpClient({ user }: AdminExpClientProps) {
  const allowedOrgs = ORG_OPTIONS.filter(o => o.role.includes(user.role)).map(o => o.id)
  
  const [activeOrg, setActiveOrg] = useState(allowedOrgs[0] || 'programming')
  const [members, setMembers] = useState<Member[]>([])
  const [logs, setLogs] = useState<ExpLog[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [loadingLogs, setLoadingLogs] = useState(false)
  
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [amount, setAmount] = useState<number>(10)
  const [isAdd, setIsAdd] = useState(true)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadMembers = useCallback(async (org: string) => {
    setLoadingMembers(true)
    setSelectedMember(null)
    try {
      const url = org === 'programming' || org === 'english'
        ? `/api/siswa?ekskul=${org}&limit=200`
        : `/api/organisasi?tipe=${org}&limit=200`
      const res = await fetch(url)
      const json = await res.json()
      const tipe = org === 'programming' || org === 'english'
        ? 'siswa'
        : org === 'osis'
          ? 'anggota_osis'
          : 'anggota_mpk'
      setMembers((json.data || []).map((item: any) => ({ ...item, tipe_anggota: tipe })))
    } catch {
      setMembers([])
    } finally {
      setLoadingMembers(false)
    }
  }, [])

  const loadLogs = useCallback(async (org: string) => {
    setLoadingLogs(true)
    try {
      const res = await fetch(`/api/exp?organisasi=${org}&limit=10`)
      const json = await res.json()
      setLogs(json.data || [])
    } catch {
      setLogs([])
    } finally {
      setLoadingLogs(false)
    }
  }, [])

  useEffect(() => {
    if (activeOrg) {
      loadMembers(activeOrg)
      loadLogs(activeOrg)
    }
  }, [activeOrg, loadMembers, loadLogs])

  async function handleSubmit() {
    if (!selectedMember || !amount || !reason.trim()) return
    setSubmitting(true)
    try {
      const selisih = isAdd ? Math.abs(amount) : -Math.abs(amount)
      const res = await fetch('/api/exp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipe_anggota: selectedMember.tipe_anggota,
          target_id: selectedMember.id,
          selisih,
          alasan: reason,
          organisasi: activeOrg,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal')
      
      alert(`Berhasil! Level Baru: ${data.levelBaru}, EXP: ${data.xpBaru}`)
      setReason('')
      setAmount(10)
      setSelectedMember(null)
      loadMembers(activeOrg)
      loadLogs(activeOrg)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      {allowedOrgs.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {ORG_OPTIONS.filter(o => allowedOrgs.includes(o.id)).map(org => (
            <button
              key={org.id}
              onClick={() => setActiveOrg(org.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                activeOrg === org.id
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-transparent'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              {org.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" /> Form Pemberian EXP
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Pilih Anggota</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  value={selectedMember?.id || ''}
                  onChange={(e) => setSelectedMember(members.find(m => m.id === parseInt(e.target.value)) || null)}
                >
                  <option value="">-- Pilih Anggota --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.nama} (Lv{m.level} • {m.xp} EXP)</option>
                  ))}
                </select>
                {loadingMembers && <p className="text-xs text-slate-500 mt-2">Memuat anggota...</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Jenis</label>
                  <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl">
                    <button
                      className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition ${isAdd ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
                      onClick={() => setIsAdd(true)}
                    >
                      <Plus className="w-4 h-4" /> Tambah
                    </button>
                    <button
                      className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition ${!isAdd ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-white'}`}
                      onClick={() => setIsAdd(false)}
                    >
                      <Minus className="w-4 h-4" /> Kurangi
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Jumlah EXP</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Alasan / Keterangan</label>
                <textarea
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
                  rows={3}
                  placeholder="Contoh: Menang lomba coding tingkat provinsi..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedMember || !amount || !reason.trim()}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? 'Memproses...' : (
                  <>
                    <Send className="w-4 h-4" /> Konfirmasi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-6 h-full">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" /> Riwayat {ORG_OPTIONS.find(o => o.id === activeOrg)?.label}
            </h2>
            
            <div className="space-y-4">
              {loadingLogs ? (
                <p className="text-sm text-slate-500 text-center py-10">Memuat riwayat...</p>
              ) : logs.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-10">Belum ada riwayat update manual.</p>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="p-3 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-bold ${log.selisih > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {log.selisih > 0 ? '+' : ''}{log.selisih} EXP
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(log.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-white line-clamp-1">
                      Anggota #{log.siswa_id || log.anggota_osis_id || log.anggota_mpk_id}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{log.alasan}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
