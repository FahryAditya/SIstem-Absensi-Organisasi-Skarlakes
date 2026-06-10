'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  CheckCircle2, 
  XCircle, 
  Mail, 
  Search, 
  Filter, 
  Loader2, 
  MoreVertical,
  ChevronDown,
  UserCheck,
  UserX,
  Clock,
  ExternalLink,
  Link as LinkIcon,
  User,
  ArrowLeft,
  RotateCw,
  X
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import toast from 'react-hot-toast'

function AdminAcceptanceContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialType = searchParams.get('type') as 'eskul' | 'osis-mpk' || 'eskul'
  const initialOrg = searchParams.get('org')

  const [type, setType] = useState<'eskul' | 'osis-mpk'>(initialType)
  const [status, setStatus] = useState(initialType === 'eskul' ? 'MENUNGGU' : 'CALON')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [query, setQuery] = useState('')
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [selectedReg, setSelectedReg] = useState<any | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'accept' | 'reject'>('accept')
  const [reason, setReason] = useState('')
  const [showLinksModal, setShowLinksModal] = useState(searchParams.get('showLinks') === 'true')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (initialOrg) {
      setQuery(initialOrg)
    }
  }, [initialOrg])

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true)
    setIsRefreshing(true)
    try {
      const res = await fetch(`/api/admin/registration/list?type=${type}&status=${status === 'SEMUA' ? '' : status}`)
      const result = await res.json().catch(() => ({ error: 'Respon server tidak valid' }))
      
      if (res.ok && Array.isArray(result)) {
        setData(result)
        setLastUpdated(new Date())
      } else {
        setData([])
        toast.error(result.error || 'Gagal mengambil data')
      }
    } catch (err: any) {
      setData([])
      toast.error('Kesalahan koneksi server')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [type, status])

  const handleAction = async () => {
    if (!selectedReg) return
    
    setProcessingId(selectedReg.id)
    try {
      const res = await fetch('/api/admin/registration/action', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedReg.id,
          type,
          action: modalType,
          reason: reason.trim()
        })
      })

      if (res.ok) {
        toast.success(modalType === 'accept' ? 'Peserta diterima' : 'Peserta ditolak')
        setShowModal(false)
        setSelectedReg(null)
        setReason('')
        fetchData(true)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Gagal memproses aksi')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setProcessingId(null)
    }
  }

  const filteredData = useMemo(() => {
    return (Array.isArray(data) ? data : []).filter(item => {
      if (!item) return false
      const searchStr = query.toLowerCase()
      return (
        item.nama_peserta?.toLowerCase().includes(searchStr) ||
        item.email_gmail?.toLowerCase().includes(searchStr) ||
        item.organization?.nama?.toLowerCase().includes(searchStr)
      )
    })
  }, [data, query])

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'DITERIMA': 
        return (
          <span className="px-3 py-1 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit">
            <CheckCircle2 className="w-3 h-3" /> DITERIMA
          </span>
        )
      case 'DITOLAK': 
        return (
          <span className="px-3 py-1 bg-[#DC143C]/10 text-[#DC143C] border border-[#DC143C]/20 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit">
            <XCircle className="w-3 h-3" /> DITOLAK
          </span>
        )
      case 'MENUNGGU':
      case 'CALON': 
        return (
          <span className="px-3 py-1 bg-[#FFB81C]/10 text-[#FFB81C] border border-[#FFB81C]/20 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit animate-pulse">
            <Clock className="w-3 h-3" /> {s}
          </span>
        )
      default: return null
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 font-sans bg-[#000B18] min-h-screen text-white">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/10">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-blue-400 mb-2">
            <UserCheck className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Management Portal</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">Penerimaan Peserta</h1>
          <p className="text-slate-400 text-sm font-medium">Validasi dan kelola pendaftaran anggota baru SKARLAKES.</p>
        </div>

        <div className="flex items-center gap-2 bg-white/[0.03] p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
          <button
            onClick={() => { setType('eskul'); setStatus('MENUNGGU'); }}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${type === 'eskul' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            Ekstrakurikuler
          </button>
          <button
            onClick={() => { setType('osis-mpk'); setStatus('CALON'); }}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${type === 'osis-mpk' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            Organisasi
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div className="lg:col-span-5 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <input
            type="text"
            placeholder="Cari nama atau email peserta..."
            className="w-full pl-12 pr-5 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="lg:col-span-3 relative group">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <select
            className="w-full pl-12 pr-10 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none text-sm font-bold cursor-pointer"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="SEMUA" className="bg-[#000B18]">Status: Semua</option>
            {type === 'eskul' ? (
              <>
                <option value="MENUNGGU" className="bg-[#000B18]">Status: Menunggu</option>
                <option value="DITERIMA" className="bg-[#000B18]">Status: Diterima</option>
                <option value="DITOLAK" className="bg-[#000B18]">Status: Ditolak</option>
              </>
            ) : (
              <>
                <option value="CALON" className="bg-[#000B18]">Status: Calon</option>
                <option value="DITERIMA" className="bg-[#000B18]">Status: Diterima</option>
                <option value="DITOLAK" className="bg-[#000B18]">Status: Ditolak</option>
              </>
            )}
          </select>
          <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none group-hover:text-white transition-colors" />
        </div>

        <div className="lg:col-span-4 flex gap-3">
          <button 
            onClick={() => fetchData()}
            disabled={isRefreshing}
            className="flex-1 bg-white/[0.03] border border-white/10 text-slate-300 font-bold py-4 px-6 rounded-2xl hover:bg-white/[0.08] hover:text-white transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
          >
            <RotateCw className={`w-4 h-4 transition-transform duration-700 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
            <span className="text-xs uppercase tracking-widest">{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
            {lastUpdated && !isRefreshing && (
              <span className="absolute bottom-1 text-[8px] text-slate-600 font-medium">
                Last: {format(lastUpdated, 'HH:mm')}
              </span>
            )}
          </button>

          <button 
            onClick={() => setShowLinksModal(true)}
            className="flex-1 bg-blue-600 text-white font-black py-4 px-6 rounded-2xl hover:bg-blue-500 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-blue-900/20 text-xs uppercase tracking-widest"
          >
            <LinkIcon className="w-4 h-4" />
            Links
          </button>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white/[0.02] backdrop-blur-3xl rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl shadow-black/40">
        <div className="overflow-x-auto mobile-scroll">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/[0.02] text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
              <tr>
                <th className="px-8 py-6">Identitas Peserta</th>
                <th className="px-8 py-6 hidden md:table-cell">Latar Belakang</th>
                <th className="px-8 py-6">Program / Org</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 hidden lg:table-cell">Waktu Daftar</th>
                <th className="px-8 py-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                        <div className="absolute inset-0 blur-xl bg-blue-500/20 rounded-full" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Mendeskripsi Data...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-40">
                      <Search className="w-12 h-12 text-slate-600" />
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Tidak ada pendaftaran ditemukan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.03] transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-black text-xs">
                          {item.nama_peserta?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{item.nama_peserta}</div>
                          <div className="text-[11px] text-slate-500 font-medium">{item.email_gmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 hidden md:table-cell">
                      <div className="text-slate-300 font-bold">{item.kelas}</div>
                      <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{item.kejuruan}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                        {item.organization?.nama}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-8 py-6 hidden lg:table-cell">
                      <div className="text-slate-400 text-xs font-bold">
                        {format(new Date(item.created_at), 'dd/MM', { locale: id })}
                      </div>
                      <div className="text-[10px] text-slate-600 font-medium">
                        {format(new Date(item.created_at), 'HH:mm', { locale: id })}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {(item.status === 'MENUNGGU' || item.status === 'CALON') ? (
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => { setSelectedReg(item); setModalType('accept'); setShowModal(true); }}
                            className="w-11 h-11 flex items-center justify-center bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-lg hover:shadow-green-900/40 group/btn"
                            title="Terima Peserta"
                          >
                            <UserCheck className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={() => { setSelectedReg(item); setModalType('reject'); setShowModal(true); }}
                            className="w-11 h-11 flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg hover:shadow-red-900/40 group/btn"
                            title="Tolak Peserta"
                          >
                            <UserX className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 text-slate-600 px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.01]">
                          <MoreVertical className="w-4 h-4 opacity-40" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Locked</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal - REDESIGNED per UIUX.md */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000B18]/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#051526] w-full max-w-lg rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300 relative">
            
            {/* Modal Header */}
            <div className={`p-8 text-center relative overflow-hidden ${modalType === 'accept' ? 'bg-green-600/10' : 'bg-red-600/10'}`}>
               <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 blur-3xl opacity-20 rounded-full ${modalType === 'accept' ? 'bg-green-500' : 'bg-red-500'}`} />
               <div className={`w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center ${modalType === 'accept' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'} shadow-2xl relative z-10`}>
                  {modalType === 'accept' ? <UserCheck className="w-10 h-10" /> : <UserX className="w-10 h-10" />}
               </div>
               <h2 className="text-3xl font-black tracking-tight text-white relative z-10">
                 {modalType === 'accept' ? 'Terima Peserta' : 'Tolak Peserta'}
               </h2>
               <p className="text-slate-400 font-medium text-sm mt-2 relative z-10 uppercase tracking-widest">Konfirmasi Keputusan</p>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Peserta Card - Step 2 Improvement */}
              <div className="bg-white/[0.03] p-6 rounded-[2rem] border border-white/10 shadow-inner relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full" />
                <div className="flex items-center gap-4 relative z-10">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <User className="w-6 h-6" />
                   </div>
                   <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">PESERTA</span>
                      <p className="font-black text-white text-xl tracking-tight leading-tight">{selectedReg?.nama_peserta}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                          {selectedReg?.organization?.nama}
                        </span>
                      </div>
                   </div>
                </div>
              </div>

              {/* Textarea - Step 1 Improvement */}
              <div className="space-y-3">
                <div className="flex justify-between items-end px-1">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Catatan (Opsional)</label>
                  <span className={`text-[10px] font-bold tracking-widest ${reason.length > 180 ? 'text-red-400' : 'text-slate-600'}`}>
                    {reason.length} / 200
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    maxLength={200}
                    aria-label="Catatan konfirmasi penerimaan peserta"
                    className="w-full px-6 py-5 rounded-[1.5rem] bg-white/[0.03] border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-32 text-sm font-medium resize-none shadow-inner"
                    placeholder="Tambahkan pesan khusus untuk peserta..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <div className="absolute bottom-4 right-4 pointer-events-none opacity-20">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-medium italic ml-1">*Pesan ini akan dikirimkan ke email peserta.</p>
              </div>

              {/* Buttons - Step 3 Improvement */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 px-6 border-2 border-white/10 bg-transparent text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-white/5 hover:border-white/20 transition-all active:scale-95"
                >
                  Batal
                </button>
                <button
                  disabled={!!processingId}
                  onClick={handleAction}
                  className={`flex-1 py-4 px-6 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3 ${
                    modalType === 'accept' ? 'bg-green-600 shadow-green-900/40 hover:bg-green-500' : 'bg-red-600 shadow-red-900/40 hover:bg-red-500'
                  }`}
                >
                  {processingId ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Konfirmasi
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Links Modal - Premium Redesign */}
      {showLinksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000B18]/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#051526] w-full max-w-2xl rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-white/5 flex justify-between items-start bg-gradient-to-br from-blue-600/10 to-transparent">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                   <LinkIcon className="w-5 h-5" />
                   <span className="text-[10px] font-black uppercase tracking-[0.25em]">Portal Access</span>
                </div>
                <h2 className="text-3xl font-black tracking-tight">Link Pendaftaran</h2>
                <p className="text-slate-400 text-sm font-medium">Salin link resmi untuk distribusi publik.</p>
              </div>
              <button 
                onClick={() => setShowLinksModal(false)} 
                className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-all border border-white/10 group"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              </button>
            </div>
            
            <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto mobile-scroll">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] px-1">Ekstrakurikuler</h3>
                <div className="grid gap-4">
                  {[
                    { name: 'Programming', link: '/registration/eskul?program=programming', color: 'from-blue-600/20' },
                    { name: 'English Club', link: '/registration/eskul?program=english', color: 'from-cyan-600/20' }
                  ].map(l => (
                    <div key={l.link} className={`p-5 bg-white/[0.02] rounded-[1.5rem] border border-white/5 flex items-center justify-between group hover:bg-white/[0.05] transition-all`}>
                      <div className="space-y-1">
                        <p className="font-black text-white text-lg tracking-tight group-hover:text-blue-400 transition-colors">{l.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono tracking-tight">{l.link}</p>
                      </div>
                      <button 
                        onClick={() => { navigator.clipboard.writeText(window.location.origin + l.link); toast.success('Link disalin!') }}
                        className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all shadow-lg active:scale-90"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] px-1">Organisasi Utama</h3>
                <div className="grid gap-4">
                  {[
                    { name: 'OSIS', link: '/registration/osis-mpk?org=osis' },
                    { name: 'MPK', link: '/registration/osis-mpk?org=mpk' }
                  ].map(l => (
                    <div key={l.link} className="p-5 bg-white/[0.02] rounded-[1.5rem] border border-white/5 flex items-center justify-between group hover:bg-white/[0.05] transition-all">
                      <div className="space-y-1">
                        <p className="font-black text-white text-lg tracking-tight group-hover:text-indigo-400 transition-colors">{l.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono tracking-tight">{l.link}</p>
                      </div>
                      <button 
                        onClick={() => { navigator.clipboard.writeText(window.location.origin + l.link); toast.success('Link disalin!') }}
                        className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all shadow-lg active:scale-90"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-[2rem] text-xs text-blue-200/60 leading-relaxed relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full" />
                <div className="relative z-10 flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-black text-blue-400">?</span>
                  </div>
                  <p className="font-medium">
                    <strong className="text-blue-400 block mb-1">Developer Tips:</strong>
                    Gunakan parameter <code className="bg-white/10 px-2 py-0.5 rounded-md text-white border border-white/10">&qr_token=KODE_UNIK</code> untuk melacak sumber pendaftaran via QR Code.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-10 bg-white/[0.01] border-t border-white/5">
              <button 
                onClick={() => setShowLinksModal(false)} 
                className="w-full py-5 bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl hover:bg-white/10 transition-all"
              >
                Kembali ke Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for Animations */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .mobile-scroll::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .mobile-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-up {
          animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}

export default function AdminAcceptancePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#000B18]"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>}>
      <AdminAcceptanceContent />
    </Suspense>
  )
}
