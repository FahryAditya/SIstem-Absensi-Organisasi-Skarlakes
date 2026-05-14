'use client'

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatDateTime } from '@/lib/utils'
import { clearJsonCache, fetchJsonCachedUrl } from '@/lib/client-cache'
import { UserX, Trash2, Loader2, Search, Filter, Clock, ArrowLeft } from 'lucide-react'

interface HasilWawancara {
  id: number
  keterangan: 'AKTIF' | 'KURANG_AKTIF'
  hasil: 'LOLOS' | 'TIDAK_LOLOS'
  persentase: number
  catatan: string | null
}

interface AntrianItem {
  id: number
  nama: string
  kelas: string
  nomor_antrian: number
  status: 'MENUNGGU' | 'WAWANCARA' | 'SELESAI_WAWANCARA'
  status_validasi: string
  hasil_wawancara: HasilWawancara | null
  sesi_id: number
  sesi_org: 'osis' | 'mpk'
  sesi_status: 'SCHEDULED' | 'ACTIVE' | 'SELESAI' | 'DIBATALKAN'
  sesi_mulai: string | null
  sesi_selesai: string | null
}

interface Props {
  user: { id: number; nama: string; email: string; role: string }
}

const orgLabelMap: Record<string, string> = {
  osis: 'OSIS',
  mpk: 'MPK',
}

const statusLabelMap: Record<string, string> = {
  MENUNGGU: 'Belum diwawancarai',
  WAWANCARA: 'Sedang diwawancarai',
  SELESAI_WAWANCARA: 'Selesai',
}

const statusStyleMap: Record<string, string> = {
  MENUNGGU: 'bg-green-50 text-green-700 border-green-200',
  WAWANCARA: 'bg-red-50 text-red-700 border-red-200',
  SELESAI_WAWANCARA: 'bg-slate-100 text-slate-600 border-slate-200',
}

const sessionStyleMap: Record<string, string> = {
  SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SELESAI: 'bg-slate-100 text-slate-600 border-slate-200',
  DIBATALKAN: 'bg-red-50 text-red-700 border-red-200',
}

export default function HapusPesertaClient({ user }: Props) {
  const [items, setItems] = useState<AntrianItem[]>([])
  const [loading, setLoading] = useState(true)
  const [orgFilter, setOrgFilter] = useState<string>('all')
  const [sessionFilter, setSessionFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AntrianItem | null>(null)
  
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        org: orgFilter === 'all' ? '' : orgFilter,
        ...(sessionFilter !== 'all' && { status: sessionFilter }),
      })
      const json = await fetchJsonCachedUrl<{ data: any[] }>(`/api/wawancara?${params}`)
      const sessions = json.data || []

      // Flatten antrian across all sessions
      const flattened: AntrianItem[] = []
      sessions.forEach((sesi: any) => {
        if (sesi.antrian && Array.isArray(sesi.antrian)) {
          sesi.antrian.forEach((q: any) => {
            flattened.push({
              ...q,
              sesi_id: sesi.id,
              sesi_org: sesi.organisasi_type,
              sesi_status: sesi.status,
              sesi_mulai: sesi.jadwal_mulai,
              sesi_selesai: sesi.jadwal_selesai,
            })
          })
        }
      })
      setItems(flattened)
    } catch (error) {
      console.error('Failed to load participants:', error)
      toast.error('Gagal memuat data peserta')
    } finally {
      setLoading(false)
    }
  }, [orgFilter, sessionFilter])

  useEffect(() => {
    load()
  }, [load])

  const filtered = items.filter((item) => {
    const matchSearch = item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.kelas.toLowerCase().includes(searchQuery.toLowerCase())
    const matchSession = sessionFilter === 'all' || item.sesi_status === sessionFilter
    return matchSearch && matchSession
  })

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/wawancara/antrian/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Gagal menghapus peserta')
      }
      toast.success(`Peserta ${deleteTarget.nama} berhasil dihapus`)
      clearJsonCache()
      load()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  function canDelete(item: AntrianItem): boolean {
    if (item.status === 'WAWANCARA') return false
    return true
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return
    setBulkDeleting(true)
    try {
      const res = await fetch(`/api/wawancara/antrian?ids=${selectedIds.join(',')}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Gagal menghapus peserta terpilih')
      }
      toast.success(`${selectedIds.length} peserta berhasil dihapus`)
      clearJsonCache()
      setSelectedIds([])
      setBulkDeleteConfirmOpen(false)
      load()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setBulkDeleting(false)
    }
  }

  function toggleSelectAll() {
    const deletableFiltered = filtered.filter(canDelete)
    if (selectedIds.length === deletableFiltered.length && deletableFiltered.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(deletableFiltered.map(item => item.id))
    }
  }

  function toggleSelect(id: number) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <UserX className="w-5 h-5 text-red-500" />
            <h2 className="page-title">Hapus Peserta Wawancara</h2>
          </div>
          <p className="page-sub mt-0.5">Hapus peserta dari antrian sesi wawancara OSIS & MPK</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.location.href = '/wawancara'} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          {selectedIds.length > 0 && (
            <button onClick={() => setBulkDeleteConfirmOpen(true)} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50">
              <Trash2 className="w-4 h-4" /> Hapus Terpilih ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="label text-xs font-bold text-slate-600 mb-1.5 block">
              <Search className="w-3.5 h-3.5 inline mr-1" />
              Cari Nama atau Kelas
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Contoh: Adam, X MPLB 1"
              className="input py-2.5"
            />
          </div>
          <div className="w-40">
            <label className="label text-xs font-bold text-slate-600 mb-1.5 block">
              <Filter className="w-3.5 h-3.5 inline mr-1" />
              Ekskul
            </label>
            <select value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)} className="input py-2.5">
              <option value="all">Semua Ekskul</option>
              <option value="osis">OSIS</option>
              <option value="mpk">MPK</option>
            </select>
          </div>
          <div className="w-44">
            <label className="label text-xs font-bold text-slate-600 mb-1.5 block">
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              Status Sesi
            </label>
            <select value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)} className="input py-2.5">
              <option value="all">Semua Sesi</option>
              <option value="SCHEDULED">Terjadwal</option>
              <option value="ACTIVE">Aktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4 border-l-4 border-l-red-500">
          <div className="text-xs font-bold text-slate-500">Total Peserta</div>
          <div className="text-2xl font-black text-slate-800 font-mono">{items.length}</div>
        </div>
        <div className="card p-4 border-l-4 border-l-amber-500">
          <div className="text-xs font-bold text-slate-500">Dapat Dihapus</div>
          <div className="text-2xl font-black text-slate-800 font-mono">{items.filter(canDelete).length}</div>
        </div>
        <div className="card p-4 border-l-4 border-l-slate-400">
          <div className="text-xs font-bold text-slate-500">Tersaring</div>
          <div className="text-2xl font-black text-slate-800 font-mono">{filtered.length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="empty-state"><Loader2 className="w-8 h-8 animate-spin" /><span>Memuat data peserta...</span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><UserX className="w-10 h-10 opacity-30" /><span>Tidak ada peserta yang sesuai filter.</span></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="th text-xs w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300" 
                      checked={selectedIds.length > 0 && selectedIds.length === filtered.filter(canDelete).length}
                      onChange={toggleSelectAll}
                      disabled={filtered.filter(canDelete).length === 0}
                    />
                  </th>
                  <th className="th text-xs">No</th>
                  <th className="th text-xs">Kandidat</th>
                  <th className="th text-xs">Kelas</th>
                  <th className="th text-xs">Ekskul</th>
                  <th className="th text-xs">Sesi</th>
                  <th className="th text-xs">Status Antrian</th>
                  <th className="th text-xs">Validasi</th>
                  <th className="th text-xs">Hasil</th>
                  <th className="th text-xs">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => {
                  const deletable = canDelete(item)
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="td">
                        {deletable ? (
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelect(item.id)}
                          />
                        ) : (
                          <input type="checkbox" disabled className="rounded border-slate-200 opacity-50" />
                        )}
                      </td>
                      <td className="td font-mono text-slate-400 text-xs">#{item.nomor_antrian}</td>
                      <td className="td">
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">{item.nama}</div>
                        </div>
                      </td>
                      <td className="td text-xs text-slate-600">{item.kelas}</td>
                      <td className="td">
                        <span className="badge bg-white border border-slate-200 text-slate-600 text-xs">
                          {orgLabelMap[item.sesi_org] || item.sesi_org}
                        </span>
                      </td>
                      <td className="td">
                        <div className="space-y-1 max-w-48">
                          <span className={`badge border text-[10px] ${sessionStyleMap[item.sesi_status]}`}>
                            {item.sesi_status}
                          </span>
                          <div className="text-[10px] text-slate-500">
                            {item.sesi_mulai ? formatDateTime(item.sesi_mulai) : '-'}
                          </div>
                        </div>
                      </td>
                      <td className="td">
                        <span className={`badge border text-[10px] ${statusStyleMap[item.status]}`}>
                          {statusLabelMap[item.status]}
                        </span>
                      </td>
                      <td className="td">
                        <div className="text-xs">
                          <span className={`badge border text-[10px] ${item.status_validasi?.includes('SAH') ? 'bg-green-50 text-green-700 border-green-200' : item.status_validasi === 'DITOLAK_VPN' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                            {item.status_validasi?.replace('_', ' ') || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="td">
                        {item.hasil_wawancara ? (
                          <span className={`badge border text-[10px] ${item.hasil_wawancara.hasil === 'LOLOS' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            {item.hasil_wawancara.hasil}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="td text-right">
                        {deletable ? (
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="btn-secondary btn-sm text-red-600 hover:bg-red-50"
                            title="Hapus peserta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            {item.status === 'WAWANCARA'
                              ? 'Sedang diwawancarai'
                              : 'Tidak dapat dihapus'}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Peserta Wawancara?"
        message={
          deleteTarget
            ? `Peserta <strong>${deleteTarget.nama}</strong> (${deleteTarget.kelas}) akan dihapus permanen dari antrian wawancara. Data hasil wawancara juga akan terhapus. Tindakan ini tidak dapat dibatalkan.`
            : ''
        }
        loading={deleting}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        confirmClass="bg-red-600 hover:bg-red-700 text-white"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkDeleteConfirmOpen}
        title="Hapus Peserta Terpilih?"
        message={`Sebanyak <strong>${selectedIds.length}</strong> peserta akan dihapus permanen dari antrian wawancara beserta hasil wawancaranya. Tindakan ini tidak dapat dibatalkan.`}
        loading={bulkDeleting}
        confirmLabel="Ya, Hapus Semua"
        cancelLabel="Batal"
        confirmClass="bg-red-600 hover:bg-red-700 text-white"
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteConfirmOpen(false)}
      />
    </div>
  )
}
