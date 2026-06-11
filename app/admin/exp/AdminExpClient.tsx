'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Zap, Search, Plus, Minus, Send, History, ChevronDown, Check } from 'lucide-react'
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

  // Custom searchable dropdown states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownContainerRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownContainerRef.current && !dropdownContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const loadMembers = useCallback(async (org: string) => {
    setLoadingMembers(true)
    setSelectedMember(null)
    setSearchQuery('')
    setIsDropdownOpen(false)
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

  const filteredMembers = members.filter(m => 
    m.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.kelas && m.kelas.toLowerCase().includes(searchQuery.toLowerCase()))
  )

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
              <div className="relative" ref={dropdownContainerRef}>
                <label className="block text-sm font-medium text-slate-400 mb-2">Pilih Anggota</label>
                
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  disabled={loadingMembers}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-left flex items-center justify-between transition-all hover:bg-white/10 hover:border-white/20 disabled:opacity-50"
                >
                  {selectedMember ? (
                    <div className="flex items-center justify-between w-full pr-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-white">{selectedMember.nama}</span>
                        {selectedMember.kelas && (
                          <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-slate-300 font-medium">
                            {selectedMember.kelas}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-white/50/20 text-blue-400 px-2 py-0.5 rounded font-bold">
                          Lv.{selectedMember.level}
                        </span>
                        <span className="text-xs text-slate-400">{selectedMember.xp} EXP</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400">
                      {loadingMembers ? 'Memuat data anggota...' : '-- Pilih Anggota --'}
                    </span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-2 bg-[#161922] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-in fade-in duration-200">
                    <div className="p-2 border-b border-white/5 relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Cari anggota berdasarkan nama atau kelas..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                      />
                    </div>
                    
                    <ul className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                      {filteredMembers.length === 0 ? (
                        <li className="px-4 py-6 text-sm text-slate-400 text-center">
                          Tidak ada anggota yang ditemukan
                        </li>
                      ) : (
                        filteredMembers.map(m => {
                          const isSelected = selectedMember?.id === m.id
                          return (
                            <li key={m.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMember(m)
                                  setIsDropdownOpen(false)
                                  setSearchQuery('')
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-white/5 flex items-center justify-between text-sm transition-colors border-b border-white/[0.02] last:border-b-0 ${
                                  isSelected ? 'bg-white/50/10 hover:bg-white/50/15' : ''
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className={`font-medium ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                                    {m.nama}
                                  </span>
                                  {m.kelas && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-medium">
                                      {m.kelas}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs bg-white/50/10 text-blue-400 px-1.5 py-0.5 rounded font-semibold">
                                      Lv.{m.level}
                                    </span>
                                    <span className="text-xs text-slate-400">{m.xp} EXP</span>
                                  </div>
                                  {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                                </div>
                              </button>
                            </li>
                          )
                        })
                      )}
                    </ul>
                  </div>
                )}

                {loadingMembers && !isDropdownOpen && (
                  <p className="text-xs text-slate-400 mt-2 animate-pulse">Memuat anggota...</p>
                )}
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
                      className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition ${!isAdd ? 'bg-red-500/100/20 text-red-400' : 'text-slate-400 hover:text-white'}`}
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
                <p className="text-sm text-slate-400 text-center py-10">Memuat riwayat...</p>
              ) : logs.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">Belum ada riwayat update manual.</p>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="p-3 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-bold ${log.selisih > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {log.selisih > 0 ? '+' : ''}{log.selisih} EXP
                      </span>
                      <span className="text-xs text-slate-400">
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
