'use client'

import { useState, useEffect, useCallback } from 'react'
import { Wallet, Search, Filter, Loader2, Plus, Minus, X, ChevronRight, Users } from 'lucide-react'
import { Skeleton } from '@/components/Skeleton'
import toast from 'react-hot-toast'
import { formatCurrency, ORG_LABELS, OrgType } from '@/lib/utils'
import { clearJsonCache, fetchJsonCachedUrl } from '@/lib/client-cache'
import { useDebounce } from '@/lib/hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { SkeletonRow } from '@/components/Skeleton'

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
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Transaction Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<KasData | null>(null)
  const [txType, setTxType] = useState<'setor' | 'tarik'>('setor')
  const [txNominal, setTxNominal] = useState('')
  const [txKet, setTxKet] = useState('')
  const [txLoading, setTxLoading] = useState(false)

  const fetchData = useCallback(() => {
    let url = `/api/kas?page=${page}&limit=${PAGE_SIZE}`
    if (activeOrg) url += `&org=${activeOrg}`
    if (debouncedSearch) url += `&search=${debouncedSearch}`

    setLoading(true)
    fetchJsonCachedUrl<{
      data?: KasData[];
      totalKas?: number;
      orgs?: string[];
      activeOrg?: string;
      total?: number;
      totalPages?: number;
    }>(url)
      .then(json => {
        setData(json.data || [])
        setTotalKas(json.totalKas || 0)
        setOrgs(json.orgs || [])
        setTotalItems(json.total || 0)
        setTotalPages(json.totalPages || 1)
        if (!activeOrg && json.activeOrg) setActiveOrg(json.activeOrg)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [page, activeOrg, debouncedSearch])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    setPage(1)
  }, [activeOrg, debouncedSearch])

  const openModal = useCallback((item: KasData, type: 'setor' | 'tarik') => {
    setSelectedItem(item)
    setTxType(type)
    setTxNominal('')
    setTxKet('')
    setModalOpen(true)
  }, [])

  const handleTransaction = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem || !txNominal) return
    
    let nominalInt = parseInt(txNominal.replace(/\D/g, ''))
    if (isNaN(nominalInt) || nominalInt <= 0) return toast.error('Nominal tidak valid')
    
    if (txType === 'tarik') {
      nominalInt = -Math.abs(nominalInt)
      if (!txKet) return toast.error('Keterangan wajib diisi saat menarik/mengurangi kas')
    }

    setTxLoading(true)
    try {
      const res = await fetch('/api/kas/transaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_anggota: selectedItem.id,
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
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    }
    setTxLoading(false)
  }, [selectedItem, txNominal, txType, txKet, activeOrg, fetchData])

  const formatTerakhirBayar = useCallback((isoDate: string | null | undefined) => {
    if (!isoDate) return '-'
    const d = new Date(isoDate)
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    
    const hari = days[d.getDay()]
    const tanggalNum = d.getDate()
    const bulan = months[d.getMonth()]
    const tahun = d.getFullYear()
    const jam = d.getHours().toString().padStart(2, '0')
    const menit = d.getMinutes().toString().padStart(2, '0')
    
    return `${jam}:${menit} ${hari}, ${tanggalNum} ${bulan} ${tahun}`
  }, [])

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="flex items-center gap-2.5">
          <Wallet className="w-6 h-6 text-amber-500" />
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Buku Kas</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">Laporan rekapitulasi pembayaran uang kas anggota secara keseluruhan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Card */}
        <div className="card p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white md:col-span-1 shadow-md">
          <div className="flex items-center gap-2 text-amber-100 mb-2">
            <Wallet className="w-5 h-5" />
            <h2 className="text-sm font-bold">Total Kas {activeOrg ? ORG_LABELS[activeOrg as OrgType] : ''}</h2>
          </div>
          <div className="text-3xl font-black font-mono">
            {formatCurrency(totalKas)}
          </div>
          <div className="text-xs text-amber-100 mt-2 opacity-80">
            Total dari seluruh anggota {activeOrg ? ORG_LABELS[activeOrg as OrgType] : ''}
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
              <div className="relative w-full sm:w-48 flex-shrink-0">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={activeOrg}
                  onChange={e => setActiveOrg(e.target.value)}
                  className="input pl-9 appearance-none"
                >
                  {orgs.map(o => (
                    <option key={o} value={o}>{ORG_LABELS[o as OrgType]}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Member List for Quick Transactions */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-[#011025]">Daftar Anggota & Transaksi Cepat</h3>
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {totalItems} Anggota
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Anggota</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terakhir Bayar</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Nominal</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="px-5 py-4"><Skeleton className="h-4 w-32 mb-1" /><Skeleton className="h-3 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-5 py-4 text-right"><Skeleton className="h-4 w-24 ml-auto" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-8 w-20 mx-auto" /></td>
                  </tr>
                ))
              ) : data.length > 0 ? (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-700 text-sm">{item.nama}</div>
                      <div className="text-xs text-slate-400 font-medium">{item.kelas}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-slate-500 font-medium">
                        {formatTerakhirBayar(item.terakhir_bayar)}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="font-bold text-slate-700 text-sm font-mono">
                        {formatCurrency(item.total_kas)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => openModal(item, 'setor')}
                          className="p-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-all"
                          title="Setor Kas"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openModal(item, 'tarik')}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                          title="Tarik Kas"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-400 text-sm">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t bg-slate-50/50 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Halaman <span className="font-bold text-slate-700">{page}</span> dari <span className="font-bold text-slate-700">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button 
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 text-xs font-bold bg-white border rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Prev
              </button>
              <button 
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-xs font-bold bg-white border rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Transaksi */}
      <AnimatePresence>
        {modalOpen && selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className={`p-4 border-b flex items-center justify-between text-white ${txType === 'setor' ? 'bg-green-600' : 'bg-red-600'}`}>
                <h3 className="font-bold flex items-center gap-2">
                  {txType === 'setor' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                  {txType === 'setor' ? 'Setor Kas Manual' : 'Tarik / Kurangi Kas'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-white/20 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
            
            <form onSubmit={handleTransaction} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border text-sm">
                <div className="text-slate-500">Anggota</div>
                <div className="font-bold text-slate-800 text-base">{selectedItem.nama}</div>
              </div>

              <div className="form-group">
                <label className="label">Nominal (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                  <input 
                    type="text" 
                    value={txNominal} 
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '')
                      setTxNominal(val ? parseInt(val).toLocaleString('id-ID') : '')
                    }}
                    className="input pl-10 font-mono font-bold text-lg" 
                    placeholder="10.000" 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Keterangan {txType === 'tarik' && <span className="text-red-500">*</span>}</label>
                <input 
                  type="text" 
                  value={txKet} 
                  onChange={e => setTxKet(e.target.value)} 
                  className="input" 
                  placeholder={txType === 'setor' ? 'Misal: Pembayaran tunggakan bulan lalu' : 'Misal: Untuk beli spidol'} 
                  required={txType === 'tarik'}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center py-2.5">Batal</button>
                <button type="submit" disabled={txLoading} className={`btn flex-1 justify-center py-2.5 text-white ${txType === 'setor' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  {txLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
