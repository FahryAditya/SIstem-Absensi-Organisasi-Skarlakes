'use client'

import { useState, useEffect } from 'react'
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
  Link as LinkIcon
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function AdminAcceptancePage() {
  const [type, setType] = useState<'eskul' | 'osis-mpk'>('eskul')
  const [status, setStatus] = useState('MENUNGGU')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [selectedReg, setSelectedReg] = useState<any | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'accept' | 'reject'>('accept')
  const [reason, setReason] = useState('')
  const [showLinksModal, setShowLinksModal] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/registration/list?type=${type}&status=${status === 'SEMUA' ? '' : status}`)
      const result = await res.json()
      setData(result)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
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
          reason
        })
      })

      if (res.ok) {
        setShowModal(false)
        setSelectedReg(null)
        setReason('')
        fetchData()
      } else {
        const err = await res.json()
        alert(err.error || 'Terjadi kesalahan')
      }
    } catch (err) {
      alert('Gagal memproses aksi')
    } finally {
      setProcessingId(null)
    }
  }

  const filteredData = data.filter(item => 
    item.nama_peserta.toLowerCase().includes(query.toLowerCase()) ||
    item.email_gmail.toLowerCase().includes(query.toLowerCase()) ||
    item.organization.nama.toLowerCase().includes(query.toLowerCase())
  )

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'DITERIMA': return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> DITERIMA</span>
      case 'DITOLAK': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> DITOLAK</span>
      case 'MENUNGGU':
      case 'CALON': return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> {s}</span>
      default: return null
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Penerimaan Peserta</h1>
          <p className="text-slate-500 text-sm">Kelola pendaftaran siswa untuk Eskul dan Organisasi</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
          <button
            onClick={() => { setType('eskul'); setStatus('MENUNGGU'); }}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${type === 'eskul' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Ekstrakurikuler
          </button>
          <button
            onClick={() => { setType('osis-mpk'); setStatus('CALON'); }}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${type === 'osis-mpk' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Organisasi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, email, atau program..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <select
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white appearance-none"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="SEMUA">Semua Status</option>
            {type === 'eskul' ? (
              <>
                <option value="MENUNGGU">Menunggu</option>
                <option value="DITERIMA">Diterima</option>
                <option value="DITOLAK">Ditolak</option>
              </>
            ) : (
              <>
                <option value="CALON">Calon</option>
                <option value="DITERIMA">Diterima</option>
                <option value="DITOLAK">Ditolak</option>
              </>
            )}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        <button 
          onClick={fetchData}
          className="bg-white border border-slate-200 text-slate-600 font-bold py-3 px-4 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5" />}
          Refresh Data
        </button>

        <button 
          onClick={() => setShowLinksModal(true)}
          className="bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
        >
          <LinkIcon className="w-5 h-5" />
          Link Pendaftaran
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Nama & Email</th>
                <th className="px-6 py-4">Kelas & Kejuruan</th>
                <th className="px-6 py-4">Program/Org</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Tgl Daftar</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Memuat data...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{item.nama_peserta}</div>
                      <div className="text-xs text-slate-400">{item.email_gmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-600 font-medium">{item.kelas}</div>
                      <div className="text-xs text-slate-400">{item.kejuruan}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                        {item.organization.nama}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {format(new Date(item.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(item.status === 'MENUNGGU' || item.status === 'CALON') ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSelectedReg(item); setModalType('accept'); setShowModal(true); }}
                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                            title="Terima"
                          >
                            <UserCheck className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => { setSelectedReg(item); setModalType('reject'); setShowModal(true); }}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="Tolak"
                          >
                            <UserX className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <button className="p-2 text-slate-300 cursor-not-allowed">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-6 text-white ${modalType === 'accept' ? 'bg-green-600' : 'bg-red-600'}`}>
              <h2 className="text-xl font-bold flex items-center gap-2">
                {modalType === 'accept' ? <UserCheck /> : <UserX />}
                Konfirmasi {modalType === 'accept' ? 'Penerimaan' : 'Penolakan'}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Peserta</p>
                <p className="font-bold text-slate-700">{selectedReg?.nama_peserta}</p>
                <p className="text-xs text-slate-500">{selectedReg?.organization?.nama}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Catatan/Alasan (Opsional)</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all h-24 text-sm"
                  placeholder={modalType === 'accept' ? 'Contoh: Selamat, Anda terpilih!' : 'Contoh: Kuota sudah penuh'}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all"
                >
                  Batal
                </button>
                <button
                  disabled={!!processingId}
                  onClick={handleAction}
                  className={`flex-1 py-3 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                    modalType === 'accept' ? 'bg-green-600 shadow-green-200' : 'bg-red-600 shadow-red-200'
                  }`}
                >
                  {processingId ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Konfirmasi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLinksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Link Pendaftaran</h2>
                <p className="text-sm text-slate-500">Gunakan link ini untuk disematkan pada QR Code atau dibagikan</p>
              </div>
              <button onClick={() => setShowLinksModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <XCircle className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">Ekstrakurikuler</h3>
                <div className="grid gap-4">
                  {[
                    { name: 'Programming', link: '/registration/eskul?program=programming' },
                    { name: 'English Club', link: '/registration/eskul?program=english' }
                  ].map(l => (
                    <div key={l.link} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group">
                      <div>
                        <p className="font-bold text-slate-700">{l.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{l.link}</p>
                      </div>
                      <button 
                        onClick={() => { navigator.clipboard.writeText(window.location.origin + l.link); alert('Link disalin!') }}
                        className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-4">Organisasi</h3>
                <div className="grid gap-4">
                  {[
                    { name: 'OSIS', link: '/registration/osis-mpk?org=osis' },
                    { name: 'MPK', link: '/registration/osis-mpk?org=mpk' }
                  ].map(l => (
                    <div key={l.link} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group">
                      <div>
                        <p className="font-bold text-slate-700">{l.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{l.link}</p>
                      </div>
                      <button 
                        onClick={() => { navigator.clipboard.writeText(window.location.origin + l.link); alert('Link disalin!') }}
                        className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-700 leading-relaxed">
                <strong>Tips:</strong> Untuk menggunakan pelacakan token QR, tambahkan parameter <code className="bg-amber-100 px-1 rounded">&qr_token=KODE_UNIK</code> di akhir link. Contoh: <code className="bg-amber-100 px-1 rounded">.../eskul?program=programming&qr_token=poster_kantin</code>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setShowLinksModal(false)} className="w-full py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-100 transition-all">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
