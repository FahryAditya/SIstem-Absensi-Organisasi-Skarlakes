'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDateTime } from '@/lib/utils'
import { fetchJsonCachedUrl } from '@/lib/client-cache'
import { useDebounce } from '@/lib/hooks'
import { ScrollText, Search, ChevronRight, Loader2, Eye, Trash2 } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import toast from 'react-hot-toast'

interface LogEntry {
  id: number
  user_id: number
  user_nama: string
  aksi: string
  tabel: string
  record_id: string | null
  deskripsi: string
  data_lama: Record<string, unknown> | null
  data_baru: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  user: { nama: string; role: string }
}

const AKSI_STYLE: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700 border-green-200',
  UPDATE: 'bg-blue-100 text-blue-700 border-blue-200',
  DELETE: 'bg-red-100 text-red-700 border-red-200',
  LOGIN:  'bg-persian-blue/20 text-blue-300 border-blue-200',
  LOGOUT: 'bg-white/10 text-slate-300 border-white/10',
}

const PAGE_SIZE = 25

export default function LogClient() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [filterAksi, setFilterAksi] = useState('')
  const [filterTabel, setFilterTabel] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [detailLog, setDetailLog] = useState<LogEntry | null>(null)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [clearing, setClearing] = useState(false)

  const handleClearLogs = async () => {
    setClearing(true)
    try {
      const res = await fetch('/api/log', {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Gagal membersihkan log')
        setClearing(false)
        return
      }
      toast.success('Log berhasil dibersihkan')
      setClearConfirmOpen(false)
      load()
    } catch (e) {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setClearing(false)
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page), limit: String(PAGE_SIZE),
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(filterAksi && { aksi: filterAksi }),
      ...(filterTabel && { tabel: filterTabel }),
    })
    const json = await fetchJsonCachedUrl<{ data?: LogEntry[]; total?: number; totalPages?: number }>(`/api/log?${params}`)
    setLogs(json.data || [])
    setTotal(json.total || 0)
    setTotalPages(json.totalPages || 1)
    setLoading(false)
  }, [page, debouncedSearch, filterAksi, filterTabel])

  useEffect(() => { load() }, [load])
  
  // Reset page when search or filters change
  useEffect(() => { 
    setPage(1) 
  }, [debouncedSearch, filterAksi, filterTabel])

  const tabelOptions = ['users', 'siswa', 'absensi', 'anggota_osis', 'anggota_mpk', 'absensi_osis', 'absensi_mpk']

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <ScrollText className="w-5 h-5 text-persian-blue/100" />
            <h2 className="page-title">Log Aktivitas</h2>
            <span className="badge bg-white/10 text-slate-300 border border-white/10">{total} log</span>
          </div>
          <p className="page-sub mt-0.5">Rekam jejak semua perubahan data dalam sistem</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setClearConfirmOpen(true)} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Bersihkan Log
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama user atau deskripsi..." className="input pl-10" />
        </div>
        <Select
          value={filterAksi}
          onChange={setFilterAksi}
          placeholder="Semua Aksi"
          className="sm:w-36"
          options={['CREATE','UPDATE','DELETE','LOGIN','LOGOUT'].map(a => ({ value: a, label: a }))}
        />
        <Select
          value={filterTabel}
          onChange={setFilterTabel}
          placeholder="Semua Tabel"
          className="sm:w-44"
          options={tabelOptions.map(t => ({ value: t, label: t }))}
        />
      </div>

      {/* Log table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="th">Waktu</th>
                <th className="th">User</th>
                <th className="th w-20">Aksi</th>
                <th className="th w-28">Tabel</th>
                <th className="th">Deskripsi</th>
                <th className="th w-20">IP</th>
                <th className="th w-16">Detail</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/10">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="td"><div className="h-4 bg-slate-200 rounded animate-pulse" style={{ width: `${50 + Math.random()*40}%` }} /></td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="td py-16 text-center text-slate-400">
                  <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <div className="text-sm">Belum ada log aktivitas</div>
                </td></tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="tr">
                    <td className="td">
                      <span className="text-xs text-slate-400 font-mono whitespace-nowrap">{formatDateTime(log.created_at)}</span>
                    </td>
                    <td className="td">
                      <div className="text-sm font-semibold text-white whitespace-nowrap">{log.user_nama}</div>
                    </td>
                    <td className="td">
                      <span className={`badge border text-[10px] font-black ${AKSI_STYLE[log.aksi] || 'bg-white/10 text-slate-300'}`}>
                        {log.aksi}
                      </span>
                    </td>
                    <td className="td">
                      <span className="font-mono text-xs text-slate-400 bg-white/10 px-1.5 py-0.5 rounded">{log.tabel}</span>
                    </td>
                    <td className="td">
                      <p className="text-sm text-slate-200 leading-snug max-w-xs truncate" title={log.deskripsi}>{log.deskripsi}</p>
                    </td>
                    <td className="td">
                      <span className="text-[10px] font-mono text-slate-400">{log.ip_address || '-'}</span>
                    </td>
                    <td className="td">
                      {(log.data_lama || log.data_baru) && (
                        <button onClick={() => setDetailLog(log)} className="btn-icon text-blue-400 hover:bg-persian-blue/10">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-white/5/50">
            <span className="text-xs text-slate-400">{total} total log — Halaman {page} dari {totalPages}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1} className="btn-icon disabled:opacity-30">
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              <span className="text-xs font-medium text-slate-300 px-2">{page}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page >= totalPages} className="btn-icon disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal open={!!detailLog} title="Detail Perubahan Data" onClose={() => setDetailLog(null)} size="lg">
        {detailLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="form-group">
                <label className="label">User</label>
                <div className="text-white font-semibold">{detailLog.user_nama}</div>
              </div>
              <div className="form-group">
                <label className="label">Waktu</label>
                <div className="text-slate-300 font-mono text-xs">{formatDateTime(detailLog.created_at)}</div>
              </div>
              <div className="form-group">
                <label className="label">Aksi</label>
                <span className={`badge border ${AKSI_STYLE[detailLog.aksi]}`}>{detailLog.aksi}</span>
              </div>
              <div className="form-group">
                <label className="label">Tabel</label>
                <span className="font-mono text-xs bg-white/10 px-2 py-1 rounded text-slate-300">{detailLog.tabel}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Deskripsi</label>
              <div className="p-3 bg-white/5 rounded-lg text-sm text-slate-200 border border-white/10">{detailLog.deskripsi}</div>
            </div>

            {detailLog.data_lama && (
              <div className="form-group">
                <label className="label flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                  Data Sebelum
                </label>
                <pre className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 overflow-auto max-h-40 font-mono">
                  {JSON.stringify(detailLog.data_lama, null, 2)}
                </pre>
              </div>
            )}

            {detailLog.data_baru && (
              <div className="form-group">
                <label className="label flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                  Data Sesudah
                </label>
                <pre className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 overflow-auto max-h-40 font-mono">
                  {JSON.stringify(detailLog.data_baru, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={clearConfirmOpen}
        title="Bersihkan Semua Log?"
        message="Seluruh catatan log aktivitas akan dihapus secara permanen dari database. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Bersihkan"
        confirmClass="btn-danger"
        loading={clearing}
        onConfirm={handleClearLogs}
        onCancel={() => setClearConfirmOpen(false)}
      />
    </div>
  )
}
