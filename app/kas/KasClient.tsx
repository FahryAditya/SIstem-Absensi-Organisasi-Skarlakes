'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Wallet, Search, Filter, Loader2, Plus, Minus, X, ChevronRight, History, ChevronDown, Check, UserCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, ORG_LABELS, OrgType } from '@/lib/utils'
import { clearJsonCache, fetchJsonCachedUrl, clientQueryClient } from '@/lib/client-cache'
import { useDebounce } from '@/lib/hooks'

import Table from '@/components/ui/Table'
import Select from '@/components/ui/Select'

interface KasData {
  id: number
  nama: string
  kelas: string
  total_kas: number
  terakhir_bayar?: string | null
}

interface Props {
  user: { id: number; nama: string; email: string; role: string }
}

const PAGE_SIZE = 20

export default function KasClient({ user }: Props) {
  const [data, setData] = useState<KasData[]>([])
  const [totalKas, setTotalKas] = useState(0)
  const [orgs, setOrgs] = useState<string[]>([])
  const [activeOrg, setActiveOrg] = useState<string>('')
  
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Member Selection State
  const [members, setMembers] = useState<{ id: number; nama: string; kelas: string }[]>([])
  const [memberLoading, setMemberLoading] = useState(false)

  // Transaction Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<number | ''>('')
  const [txType, setTxType] = useState<'setor' | 'tarik'>('setor')
  const [txNominal, setTxNominal] = useState('')
  const [txKet, setTxKet] = useState('')
  const [txLoading, setTxLoading] = useState(false)

  // Custom dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const url = `/api/kas?org=${activeOrg}&search=${debouncedSearch}&page=${page}&limit=${PAGE_SIZE}`
      const json = await fetchJsonCachedUrl<any>(url)
      setData(json.data)
      setTotalPages(json.totalPages)
      setTotalItems(json.total)
      setTotalKas(json.totalKas)
      setOrgs(json.orgs)
      if (!activeOrg && json.orgs.length > 0) setActiveOrg(json.orgs[0])
    } catch (err: any) {
      toast.error(err.message)
    }
    setLoading(false)
  }, [activeOrg, debouncedSearch, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    setPage(1)
  }, [activeOrg, debouncedSearch])

  const fetchMembers = useCallback(async (org: string) => {
    if (!org) return
    setMemberLoading(true)
    try {
      const res = await fetch(`/api/kas/members?org=${org}`)
      const json = await res.json()
      setMembers(json.data || [])
    } catch (err) {
      console.error(err)
    }
    setMemberLoading(false)
  }, [])

  const openModal = useCallback((memberId?: number) => {
    setSelectedMemberId(memberId || '')
    setTxType('setor')
    setTxNominal('')
    setTxKet('')
    setMemberSearch('')
    setDropdownOpen(false)
    setModalOpen(true)
    if (members.length === 0) fetchMembers(activeOrg)
  }, [activeOrg, members.length, fetchMembers])

  const handleTransaction = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMemberId || !txNominal) return
    
    let nominalInt = parseInt(txNominal.replace(/\D/g, ''))
    if (isNaN(nominalInt) || nominalInt <= 0) return toast.error('Nominal tidak valid')
    
    setTxLoading(true)
    try {
      const res = await fetch('/api/kas/transaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_anggota: selectedMemberId,
          org: activeOrg,
          nominal: nominalInt,
          keterangan: txKet || 'Setor uang kas'
        })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success(json.message || 'Transaksi berhasil')
      setModalOpen(false)
      clearJsonCache()
      // Remove any stale /api/dashboard cache entries so the dashboard re-fetches fresh totals
      clientQueryClient.removeQueries({ predicate: q => {
        const [, k] = q.queryKey
        return typeof k === 'string' && k.startsWith('/api/dashboard')
      } })
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    }
    setTxLoading(false)
  }, [selectedMemberId, txNominal, txKet, activeOrg, fetchData])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members
    const q = memberSearch.toLowerCase()
    return members.filter(m =>
      m.nama.toLowerCase().includes(q) || m.kelas.toLowerCase().includes(q)
    )
  }, [members, memberSearch])

  const selectedMember = useMemo(() =>
    members.find(m => m.id === selectedMemberId) ?? null
  , [members, selectedMemberId])

  // Avatar color based on first char
  function avatarColor(nama: string) {
    const colors = [
      'bg-white/50','bg-emerald-500','bg-persian-blue/100','bg-amber-500/100',
      'bg-rose-500','bg-cyan-500','bg-orange-500','bg-persian-blue/100',
    ]
    return colors[(nama.charCodeAt(0) || 0) % colors.length]
  }

  const formatTerakhirBayar = useCallback((isoDate: string | null | undefined) => {
    if (!isoDate) return '-'
    const d = new Date(isoDate)
    const tanggalNum = d.getDate()
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    
    const hari = days[d.getDay()]
    const bulan = months[d.getMonth()]
    const jam = d.getHours().toString().padStart(2, '0')
    const menit = d.getMinutes().toString().padStart(2, '0')
    
    return `${hari}, ${tanggalNum} ${bulan} ${jam}:${menit}`
  }, [])

  const columns = useMemo(() => [
    {
      key: 'no',
      label: 'No',
      render: (item: KasData) => {
        const idx = data.indexOf(item)
        return <span className="text-slate-400 font-mono text-xs">{(page - 1) * PAGE_SIZE + idx + 1}</span>
      }
    },
    {
      key: 'nama',
      label: 'Nama Anggota',
      className: 'min-w-[150px]',
      render: (item: KasData) => (
        <div className="py-1">
          <div className="font-bold text-white text-sm leading-tight">{item.nama}</div>
          <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">{item.kelas}</div>
        </div>
      )
    },
    {
      key: 'organisasi',
      label: 'Organisasi',
      className: 'hidden sm:table-cell',
      render: (item: KasData & { organisasi?: string }) => (
        <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-white/10 text-slate-300 uppercase tracking-tight">
          {item.organisasi || activeOrg}
        </span>
      )
    },
    {
      key: 'total_kas',
      label: 'Total Kas',
      className: 'min-w-[100px]',
      render: (item: KasData) => (
        <div className="font-mono font-bold text-emerald-600 text-sm">
          {formatCurrency(item.total_kas)}
        </div>
      )
    },
    {
      key: 'terakhir_bayar',
      label: 'Terakhir Bayar',
      className: 'hidden md:table-cell min-w-[140px]',
      render: (item: KasData) => (
        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
          <History className="w-3 h-3 text-slate-400" />
          {formatTerakhirBayar(item.terakhir_bayar)}
        </div>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (item: KasData) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => openModal(item.id)}
            className="p-2 bg-green-500/10 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-all duration-200"
            title="Setor Kas"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ], [data, page, openModal, formatTerakhirBayar])

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-black text-white tracking-tight">Buku Kas</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">Laporan rekapitulasi pembayaran uang kas anggota secara keseluruhan.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => openModal()} className="btn-primary whitespace-nowrap shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Setor Kas
          </button>
          <a href="/pengeluaran" className="btn bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white border-white/10 whitespace-nowrap shadow-sm">
            <Minus className="w-4 h-4 mr-1.5" />
            Tarik Kas
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Card */}
        <div className="card p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white md:col-span-1 shadow-md">
          <div className="flex items-center gap-2 text-emerald-100 mb-2">
            <Wallet className="w-5 h-5" />
            <h2 className="text-sm font-bold">Saldo Kas Saat Ini</h2>
          </div>
          <div className="text-3xl font-black font-mono">
            {formatCurrency(totalKas)}
          </div>
          <div className="text-xs text-emerald-100 mt-2 opacity-80">
            Total kas masuk dikurangi total pengeluaran {activeOrg ? ORG_LABELS[activeOrg as OrgType] : ''}
          </div>
        </div>

        {/* Filters */}
        <div className="card p-5 md:col-span-2 flex flex-col justify-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama anggota..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input pl-9"
              />
            </div>
            {orgs.length > 1 && (
              <Select
                value={activeOrg}
                onChange={v => {
                  setActiveOrg(v)
                  setMembers([]) // Reset members when org changes
                }}
                className="w-full sm:w-48 flex-shrink-0"
                options={orgs.map(o => ({ value: o, label: ORG_LABELS[o as OrgType] }))}
              />
            )}
          </div>
        </div>
      </div>

      {/* Quick Transaction Buttons */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-bold text-white">Transaksi Manual Cepat</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-100">
            <div className="text-xs font-semibold text-green-400 mb-1">Setor Kas</div>
            <p className="text-xs text-slate-300 mb-3">Tambahkan kas untuk anggota secara manual</p>
            <button 
              onClick={() => {
                if (data.length > 0) openModal(data[0].id)
                else openModal()
              }}
              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors"
            >
              Setor Kas
            </button>
          </div>
          <div className="p-4 bg-red-500/10 rounded-lg border border-red-100">
            <div className="text-xs font-semibold text-red-400 mb-1">Tarik Kas</div>
            <p className="text-xs text-slate-300 mb-3">Kurangi kas untuk pengeluaran</p>
            <a 
              href="/pengeluaran"
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center"
            >
              Tarik Kas
            </a>
          </div>
        </div>
      </div>

      {/* Tabel Utama Anggota */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            Daftar Pembayaran Anggota
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {totalItems} Total Anggota
          </span>
        </div>
        <Table
          columns={columns}
          data={data}
          loading={loading}
          page={page}
          totalPages={totalPages}
          total={totalItems}
          onPageChange={setPage}
        />
      </div>

      {/* Modal Transaksi — CSS native, tanpa framer-motion */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          style={{ animation: 'fadeIn 0.15s ease' }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div
            className="bg-deep-navy rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            style={{ animation: 'slideUp 0.15s ease' }}
          >
            <div className="p-4 border-b flex items-center justify-between text-white bg-green-600">
              <h3 className="font-bold flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Setor Kas Manual
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-white/20 rounded-lg" aria-label="Tutup modal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransaction} className="p-5 space-y-4">
              <div className="form-group">
                <label className="label">Pilih Anggota</label>

                {memberLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400 p-3 bg-white/5 rounded-xl border border-dashed">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                    Memuat daftar anggota...
                  </div>
                ) : (
                  <div ref={dropdownRef} className="relative">
                    {/* Trigger button */}
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(o => !o)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-2 bg-deep-navy text-left transition-all duration-200 ${
                        dropdownOpen
                          ? 'border-emerald-400 ring-2 ring-emerald-100 shadow-sm'
                          : 'border-white/10 hover:border-emerald-300'
                      }`}
                    >
                      {selectedMember ? (
                        <>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-sm ${avatarColor(selectedMember.nama)}`}>
                            {selectedMember.nama.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white truncate">{selectedMember.nama}</div>
                            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{selectedMember.kelas}</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                            <UserCircle2 className="w-5 h-5 text-slate-400" />
                          </div>
                          <span className="text-slate-400 text-sm flex-1">-- Pilih Anggota --</span>
                        </>
                      )}
                      <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown panel */}
                    {dropdownOpen && (
                      <div
                        className="absolute z-50 w-full mt-2 bg-deep-navy rounded-2xl border border-white/10 shadow-2xl shadow-slate-200/80 overflow-hidden"
                        style={{ animation: 'slideUp 0.15s ease' }}
                      >
                        {/* Search bar */}
                        <div className="p-3 border-b border-white/10">
                          <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              autoFocus
                              type="text"
                              placeholder="Cari nama atau kelas..."
                              value={memberSearch}
                              onChange={e => setMemberSearch(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
                            />
                          </div>
                        </div>

                        {/* Member list */}
                        <div className="max-h-52 overflow-y-auto py-1.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                          {filteredMembers.length === 0 ? (
                            <div className="py-6 text-center text-sm text-slate-400">Anggota tidak ditemukan</div>
                          ) : (
                            filteredMembers.map(m => {
                              const isSelected = m.id === selectedMemberId
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedMemberId(m.id)
                                    setDropdownOpen(false)
                                    setMemberSearch('')
                                  }}
                                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${
                                    isSelected
                                      ? 'bg-emerald-50'
                                      : 'hover:bg-white/5'
                                  }`}
                                >
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-sm ${
                                    isSelected ? 'bg-emerald-500' : avatarColor(m.nama)
                                  }`}>
                                    {m.nama.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-semibold truncate ${
                                      isSelected ? 'text-emerald-700' : 'text-slate-200'
                                    }`}>{m.nama}</div>
                                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{m.kelas}</div>
                                  </div>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                  )}
                                </button>
                              )
                            })
                          )}
                        </div>

                        {/* Footer count */}
                        <div className="px-4 py-2 border-t border-white/10 bg-white/5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {filteredMembers.length} dari {members.length} anggota
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="kas-nominal" className="label">Nominal Setoran (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                  <input
                    id="kas-nominal"
                    type="text"
                    value={txNominal}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '')
                      setTxNominal(val ? parseInt(val).toLocaleString('id-ID') : '')
                    }}
                    className="input pl-10 font-mono font-bold text-lg text-emerald-600"
                    placeholder="10.000"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="kas-ket" className="label">Keterangan</label>
                <input
                  id="kas-ket"
                  type="text"
                  value={txKet}
                  onChange={e => setTxKet(e.target.value)}
                  className="input"
                  placeholder="Misal: Pembayaran bulan Mei"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center py-2.5">Batal</button>
                <button type="submit" disabled={txLoading} className="btn flex-1 justify-center py-2.5 text-white bg-green-600 hover:bg-green-700">
                  {txLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Setoran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
