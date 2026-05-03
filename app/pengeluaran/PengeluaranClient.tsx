'use client'

import { useState, useEffect } from 'react'
import { HandCoins, Search, Filter, Loader2, Plus, X, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDateTime, ORG_LABELS, OrgType } from '@/lib/utils'

interface PengeluaranData {
  id: number
  organisasi_type: OrgType
  nominal: number
  keterangan: string
  tanggal: string
  creator_nama: string
  
}

interface Props {
  user: { id: number; nama: string; email: string; role: string }
}

export default function PengeluaranClient({ user }: Props) {
  const [data, setData] = useState<PengeluaranData[]>([])
  const [orgs, setOrgs] = useState<string[]>([])
  const [activeOrg, setActiveOrg] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Transaction Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [txOrg, setTxOrg] = useState<string>('')
  const [txNominal, setTxNominal] = useState('')
  const [txKet, setTxKet] = useState('')
  const [txLoading, setTxLoading] = useState(false)

  const fetchData = () => {
    let url = '/api/pengeluaran?'
    if (activeOrg) url += `org=${activeOrg}`

    setLoading(true)
    fetch(url)
      .then(res => res.json())
      .then(json => {
        setData(json.data || [])
        setOrgs(json.orgs || [])
        if (!activeOrg && json.activeOrg) setActiveOrg(json.activeOrg)
        if (!txOrg && json.activeOrg) setTxOrg(json.activeOrg)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [activeOrg])

  function openModal() {
    setTxNominal('')
    setTxKet('')
    setTxOrg(activeOrg || orgs[0] || '')
    setModalOpen(true)
  }

  async function handleDelete(id: number) {
    if (!confirm('Yakin ingin membatalkan dan menghapus transaksi ini? Saldo akan dikembalikan.')) return
    
    try {
      const res = await fetch(`/api/pengeluaran?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success(json.message || 'Transaksi dihapus')
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleTransaction(e: React.FormEvent) {
    e.preventDefault()
    if (!txOrg || !txNominal || !txKet) return
    
    let nominalInt = parseInt(txNominal.replace(/\D/g, ''))
    if (isNaN(nominalInt) || nominalInt <= 0) return toast.error('Nominal tidak valid')

    setTxLoading(true)
    try {
      const res = await fetch('/api/pengeluaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org: txOrg,
          nominal: nominalInt,
          keterangan: txKet
        })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      
      toast.success(json.message || 'Pengeluaran berhasil dicatat')
      setModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    }
    setTxLoading(false)
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <HandCoins className="w-6 h-6 text-red-500" />
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Pengeluaran Kas</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Catat dan pantau penarikan dana kas organisasi.</p>
        </div>
        <button onClick={openModal} className="btn-primary whitespace-nowrap self-start sm:self-auto shadow-sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Tarik Kas
        </button>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-bold text-slate-700">Filter Riwayat</h3>
        </div>
        {orgs.length > 1 && (
          <div className="relative w-full sm:w-64">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={activeOrg}
              onChange={e => setActiveOrg(e.target.value)}
              className="input pl-9 appearance-none"
            >
              {user.role === 'administrator' && <option value="">Semua Unit / Organisasi</option>}
              {orgs.map(o => (
                <option key={o} value={o}>{ORG_LABELS[o as OrgType]}</option>
              ))}
            </select>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto mt-4 rounded-xl border border-slate-200">
          <table className="table">
            <thead>
              <tr>
                <th className="w-12">No</th>
                <th className="min-w-[150px]">Tanggal & Waktu</th>
                <th className="min-w-[120px]">Unit</th>
                <th className="min-w-[200px]">Keterangan</th>
                <th className="min-w-[150px]">Ditarik Oleh</th>
                <th className="text-right min-w-[120px]">Nominal</th>
                <th className="w-16 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="h-32 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Memuat data pengeluaran...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-32 text-center text-slate-400">
                    Belum ada riwayat pengeluaran kas.
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="font-medium text-slate-500">{idx + 1}</td>
                    <td className="text-slate-600 text-sm">{formatDateTime(new Date(item.tanggal))}</td>
                    <td>
                      <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                        {ORG_LABELS[item.organisasi_type as OrgType] || item.organisasi_type}
                      </span>
                    </td>
                    <td className="font-medium text-slate-800">{item.keterangan}</td>
                    <td className="text-slate-600 text-sm">{item.creator_nama}</td>
                    <td className="text-right font-mono font-bold text-red-600 bg-red-50/30">
                      - {formatCurrency(item.nominal)}
                    </td>
                    <td className="text-center">
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg tooltip-trigger" title="Hapus Transaksi">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Transaksi */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm slide-up">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between text-white bg-red-600">
              <h3 className="font-bold flex items-center gap-2">
                <HandCoins className="w-5 h-5" />
                Penarikan Kas Organisasi
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-white/20 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleTransaction} className="p-5 space-y-4">
              <div className="form-group">
                <label className="label">Unit / Organisasi</label>
                <select 
                  value={txOrg} 
                  onChange={e => setTxOrg(e.target.value)} 
                  className="input bg-slate-50"
                  required
                >
                  <option value="" disabled>Pilih Unit</option>
                  {orgs.map(o => (
                    <option key={o} value={o}>{ORG_LABELS[o as OrgType]}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Nominal Tarik (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                  <input 
                    type="text" 
                    value={txNominal} 
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '')
                      setTxNominal(val ? parseInt(val).toLocaleString('id-ID') : '')
                    }}
                    className="input pl-10 font-mono font-bold text-lg text-red-600" 
                    placeholder="50.000" 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Keterangan Penggunaan <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={txKet} 
                  onChange={e => setTxKet(e.target.value)} 
                  className="input" 
                  placeholder="Misal: Membeli spidol dan kertas" 
                  required
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center py-2.5">Batal</button>
                <button type="submit" disabled={txLoading} className="btn flex-1 justify-center py-2.5 text-white bg-red-600 hover:bg-red-700">
                  {txLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tarik Kas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
