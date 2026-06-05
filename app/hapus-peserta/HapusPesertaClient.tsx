'use client'

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatDateTime } from '@/lib/utils'
import { clearJsonCache, fetchJsonCachedUrl } from '@/lib/client-cache'
import { UserX, Trash2, Loader2, Search, Filter, Clock, ArrowLeft } from 'lucide-react'
import Select from '@/components/ui/Select'

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
  MENUNGGU: 'bg-green-500/10 text-green-400 border-white/10',
  WAWANCARA: 'bg-red-500/10 text-red-400 border-white/10',
  SELESAI_WAWANCARA: 'bg-white/10 text-slate-300 border-white/10',
}

const sessionStyleMap: Record<string, string> = {
  SCHEDULED: 'bg-white/5 text-blue-300 border-white/10',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SELESAI: 'bg-white/10 text-slate-300 border-white/10',
  DIBATALKAN: 'bg-red-500/10 text-red-400 border-white/10',
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
            <button onClick={() => setBulkDeleteConfirmOpen(true)} className="btn-secondary text-red-600 border-white/10 hover:bg-red-500/10">
              <Trash2 className="w-4 h-4" /> Hapus Terpilih ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="label text-xs font-bold text-slate-300 mb-1.5 block">
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
            <label className="label text-xs font-bold text-slate-300 mb-1.5 block">
              <Filter className="w-3.5 h-3.5 inline mr-1" />
              Ekskul
            </label>
            <Select
              value={orgFilter}
              onChange={setOrgFilter}
              options={[
                { value: 'all', label: 'Semua Ekskul' },
                { value: 'osis', label: 'OSIS' },
                { value: 'mpk', label: 'MPK' },
              ]}
            />
          </div>
          <div className="w-44">
            <label className="label text-xs font-bold text-slate-300 mb-1.5 block">
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              Status Sesi
            </label>
            <Select
              value={sessionFilter}
              onChange={setSessionFilter}
              options={[
                { value: 'all', label: 'Semua Sesi' },
                { value: 'SCHEDULED', label: 'Terjadwal' },
                { value: 'ACTIVE', label: 'Aktif' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4 border-l-4 border-l-red-500">
          <div className="text-xs font-bold text-slate-400">Total Peserta</div>
          <div className="text-2xl font-black text-white font-mono">{items.length}</div>
        </div>
        <div className="card p-4 border-l-4 border-l-amber-500">
          <div className="text-xs font-bold text-slate-400">Dapat Dihapus</div>
          <div className="text-2xl font-black text-white font-mono">{items.filter(canDelete).length}</div>
        </div>
        <div className="card p-4 border-l-4 border-l-slate-400">
          <div className="text-xs font-bold text-slate-400">Tersaring</div>
          <div className="text-2xl font-black text-white font-mono">{filtered.length}</div>
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
                <tr className="bg-white/5 border-b border-white/10">
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
                    <tr key={item.id} className="hover:bg-white/5">
                      <td className="td">
                        {deletable ? (
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelect(item.id)}
                          />
                        ) : (
                          <input type="checkbox" disabled className="rounded border-white/10 opacity-50" />
                        )}
                      </td>
                      <td className="td font-mono text-slate-400 text-xs">#{item.nomor_antrian}</td>
                      <td className="td">
                        <div>
                          <div className="font-semibold text-white text-sm">{item.nama}</div>
                        </div>
                      </td>
                      <td className="td text-xs text-slate-300">{item.kelas}</td>
                      <td className="td">
                        <span className="badge bg-deep-navy border border-white/10 text-slate-300 text-xs">
                          {orgLabelMap[item.sesi_org] || item.sesi_org}
                        </span>
                      </td>
                      <td className="td">
                        <div className="space-y-1 max-w-48">
                          <span className={`badge border text-[10px] ${sessionStyleMap[item.sesi_status]}`}>
                            {item.sesi_status}
                          </span>
                          <div className="text-[10px] text-slate-400">
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
                          <span className={`badge border text-[10px] ${item.status_validasi?.includes('SAH') ? 'bg-green-500/10 text-green-400 border-white/10' : item.status_validasi === 'DITOLAK_VPN' ? 'bg-red-500/10 text-red-400 border-white/10' : 'bg-white/5 text-slate-200 border-white/10'}`}>
                            {item.status_validasi?.replace('_', ' ') || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="td">
                        {item.hasil_wawancara ? (
                          <span className={`badge border text-[10px] ${item.hasil_wawancara.hasil === 'LOLOS' ? 'bg-green-500/10 text-green-400 border-white/10' : 'bg-red-500/10 text-red-400 border-white/10'}`}>
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
                            className="btn-secondary btn-sm text-red-600 hover:bg-red-500/10"
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
