'use client'

import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { formatDate, ORG_LABELS, OrgType } from '@/lib/utils'
import { getAccessibleOrgs } from '@/lib/auth-shared'
import { BarChart3, Calendar, ClipboardList, Database, Download, FileSpreadsheet, Filter, Loader2, Search, ShieldAlert, Trash2, Wallet } from 'lucide-react'
import { format, startOfMonth } from 'date-fns'

interface Props {
  user: { id: number; nama: string; email: string; role: string }
}

type ExportType = 'absensi' | 'kas' | 'kehadiran' | 'absensi_kehadiran' | 'semua'
type ClearType = 'absensi' | 'kas' | 'anggota' | 'semua'

const exportOptions: { value: ExportType; label: string; desc: string; sheets: string; icon: typeof ClipboardList }[] = [
  { value: 'absensi', label: 'Single - Absensi', desc: 'Hadir / Tidak Hadir per anggota', sheets: 'Sheet 1: Absensi', icon: ClipboardList },
  { value: 'kas', label: 'Single - Kas', desc: 'Riwayat kas dengan format Rupiah', sheets: 'Sheet 1: Kas', icon: Wallet },
  { value: 'kehadiran', label: 'Single - Kehadiran', desc: 'Total kehadiran per siswa', sheets: 'Sheet 1: Kehadiran', icon: BarChart3 },
  { value: 'absensi_kehadiran', label: 'Kombinasi', desc: 'Absensi dan rekap kehadiran', sheets: 'Sheet 1: Absensi, Sheet 2: Kehadiran', icon: FileSpreadsheet },
  { value: 'semua', label: 'Semua Sekaligus', desc: 'Absensi, kas, dan kehadiran', sheets: 'Sheet 1: Absensi, Sheet 2: Kas, Sheet 3: Kehadiran', icon: Database },
]

const clearOptions: { value: ClearType; label: string; desc: string }[] = [
  { value: 'absensi', label: 'Absensi', desc: 'Hapus semua data absensi ekskul tersebut' },
  { value: 'kas', label: 'Kas', desc: 'Kosongkan kas dan hapus pengeluaran ekskul tersebut' },
  { value: 'anggota', label: 'Siswa / Anggota', desc: 'Hapus semua anggota ekskul tersebut' },
  { value: 'semua', label: 'Semua', desc: 'Hapus Absensi + Kas + Anggota ekskul tersebut' },
]

export default function ExportClient({ user }: Props) {
  const orgs = getAccessibleOrgs(user.role) as OrgType[]
  const isSuperAdmin = user.role === 'administrator'
  const [exportType, setExportType] = useState<ExportType>('absensi')
  const [orgFilter, setOrgFilter] = useState<string>(isSuperAdmin ? '' : (orgs[0] || ''))
  const [kelasFilter, setKelasFilter] = useState('')
  const [namaFilter, setNamaFilter] = useState('')
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)

  const [clearOrg, setClearOrg] = useState<string>(orgs[0] || 'programming')
  const [clearType, setClearType] = useState<ClearType>('absensi')
  const [clearConfirm, setClearConfirm] = useState('')
  const [clearing, setClearing] = useState(false)

  const currentOption = useMemo(() => exportOptions.find(o => o.value === exportType) ?? exportOptions[0], [exportType])
  const selectedExportOrgs = orgFilter ? [orgFilter] : orgs
  const expectedConfirm = `HAPUS ${clearOrg.toUpperCase()}`

  async function handleExport() {
    if (!startDate || !endDate) {
      toast.error('Tanggal mulai dan akhir wajib diisi')
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        tipe: exportType,
        start: startDate,
        end: endDate,
        ...(orgFilter && { org: orgFilter }),
        ...(kelasFilter.trim() && { kelas: kelasFilter.trim() }),
        ...(namaFilter.trim() && { nama: namaFilter.trim() }),
      })
      const res = await fetch(`/api/export?${params}`)
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error || 'Export gagal')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const cd = res.headers.get('content-disposition') || ''
      a.download = cd.match(/filename="(.+)"/)?.[1] ?? `export_${exportType}_${format(new Date(), 'yyyyMMdd')}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('File Excel berhasil diunduh')
    } catch {
      toast.error('Terjadi kesalahan saat export')
    } finally {
      setLoading(false)
    }
  }

  async function handleClearDatabase() {
    if (!isSuperAdmin) return
    if (clearConfirm !== expectedConfirm) {
      toast.error(`Ketik ${expectedConfirm} untuk konfirmasi`)
      return
    }

    setClearing(true)
    try {
      const res = await fetch('/api/admin/clear-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org: clearOrg, tipe: clearType, konfirmasi: clearConfirm }),
      })
      const data = await res.json().catch((e) => {
        console.error('Clear database: failed to parse server response', res.status, res.statusText, e)
        if (res.status > 0) {
          throw new Error(`Server error ${res.status} ${res.statusText} — cek log server`)
        }
        throw new Error('Tidak dapat terhubung ke server')
      })
      if (!res.ok) {
        toast.error(data?.error || 'Clear database gagal')
        return
      }
      setClearConfirm('')
    } catch {
      toast.error('Terjadi kesalahan saat clear database')
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-6">
        <div>
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
            <h2 className="page-title">Export Data ke Excel</h2>
          </div>
          <p className="page-sub mt-0.5">Download laporan sesuai hak akses role pengguna.</p>
        </div>

        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">1</span>
            <h3 className="text-sm font-bold text-slate-700">Pilih Data Export</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {exportOptions.map(opt => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  onClick={() => setExportType(opt.value)}
                  className={`p-4 rounded-lg border text-left transition-all ${exportType === opt.value ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'}`}
                >
                  <Icon className={exportType === opt.value ? 'w-5 h-5 text-indigo-600 mb-2' : 'w-5 h-5 text-slate-500 mb-2'} />
                  <div className="text-sm font-bold text-slate-800">{opt.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{opt.desc}</div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">2</span>
            <h3 className="text-sm font-bold text-slate-700">Atur Filter</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="form-group">
              <label className="label"><Calendar className="w-3 h-3 inline mr-1" />Tanggal Mulai *</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
            </div>
            <div className="form-group">
              <label className="label"><Calendar className="w-3 h-3 inline mr-1" />Tanggal Akhir *</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="form-group">
              <label className="label"><Filter className="w-3 h-3 inline mr-1" />Ekskul</label>
              <select value={orgFilter} onChange={e => setOrgFilter(e.target.value)} className="input" disabled={!isSuperAdmin && orgs.length <= 1}>
                {isSuperAdmin && <option value="">Semua ekskul</option>}
                {orgs.map(o => <option key={o} value={o}>{ORG_LABELS[o]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Kelas</label>
              <input value={kelasFilter} onChange={e => setKelasFilter(e.target.value)} className="input" placeholder="Opsional" />
            </div>
            <div className="form-group">
              <label className="label"><Search className="w-3 h-3 inline mr-1" />Nama</label>
              <input value={namaFilter} onChange={e => setNamaFilter(e.target.value)} className="input" placeholder="Opsional" />
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 leading-relaxed">
            <strong>{currentOption.sheets}</strong>. Scope export: {selectedExportOrgs.map(o => ORG_LABELS[o as OrgType]).join(', ')}.
            {startDate && endDate ? <> Periode {formatDate(startDate)} sampai {formatDate(endDate)}.</> : <> Export diblokir jika tanggal kosong.</>}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">3</span>
            <h3 className="text-sm font-bold text-slate-700">Download File</h3>
          </div>
          <button onClick={handleExport} disabled={loading || !startDate || !endDate} className="btn-primary w-full justify-center py-3 text-base">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Menyiapkan file Excel...</> : <><Download className="w-5 h-5" />Download Excel (.xlsx)</>}
          </button>
          <div className="mt-4 space-y-1.5 text-xs text-slate-500">
            <div>Format Microsoft Excel (.xlsx)</div>
            <div>Semua aksi export tercatat di Log Aktivitas</div>
            <div>File dibuat langsung sebagai respons unduhan dan tidak disimpan permanen di server</div>
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-6">
        <div className="card p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800">Kontrol Akses</h3>
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            <div><strong>Super Admin:</strong> dapat export semua ekskul atau memilih ekskul tertentu.</div>
            <div><strong>Admin Ekskul:</strong> export dibatasi sesuai role pengguna.</div>
            <div><strong>Tanggal:</strong> wajib diisi untuk semua export.</div>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="card p-5 border-red-200 bg-red-50/40">
            <div className="flex items-center gap-2.5 mb-4">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-bold text-red-800">Clear Database</h3>
            </div>
            <div className="space-y-3">
              <div className="form-group">
                <label className="label">Ekskul *</label>
                <select value={clearOrg} onChange={e => { setClearOrg(e.target.value); setClearConfirm('') }} className="input">
                  {orgs.map(o => <option key={o} value={o}>{ORG_LABELS[o]}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Data yang Dihapus *</label>
                <select value={clearType} onChange={e => setClearType(e.target.value as ClearType)} className="input">
                  {clearOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <p className="text-xs text-slate-500 mt-1">{clearOptions.find(o => o.value === clearType)?.desc}</p>
              </div>
              <div className="form-group">
                <label className="label">Konfirmasi *</label>
                <input value={clearConfirm} onChange={e => setClearConfirm(e.target.value)} className="input" placeholder={expectedConfirm} />
              </div>
              <button onClick={handleClearDatabase} disabled={clearing || clearConfirm !== expectedConfirm} className="btn-secondary w-full justify-center text-red-700 border-red-200 hover:bg-red-50">
                {clearing ? <><Loader2 className="w-4 h-4 animate-spin" />Memproses...</> : <><Trash2 className="w-4 h-4" />Clear Database</>}
              </button>
              <p className="text-xs text-red-700 leading-relaxed">
                Sistem membuat backup otomatis sebelum hapus. Proses selalu per ekskul, data ekskul lain tidak disentuh.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
