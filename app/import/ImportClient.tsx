'use client'

import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Upload, FileSpreadsheet, Table as TableIcon, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAccessibleOrgs } from '@/lib/auth-shared'

interface ImportRow {
  nama?: string
  kelas?: string
  nis?: string | number
  jabatan?: string
}

interface Props {
  user: { id: number; nama: string; email: string; role: string }
}

type OrgType = 'programming' | 'english' | 'osis' | 'mpk'

const ORG_LABELS: Record<OrgType, string> = {
  programming: 'Programming',
  english: 'English Club',
  osis: 'OSIS',
  mpk: 'MPK',
}

export default function ImportClient({ user }: Props) {
  const orgs = getAccessibleOrgs(user.role) as OrgType[]
  const [selectedOrg, setSelectedOrg] = useState<OrgType>(orgs[0] || 'programming')
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [preview, setPreview] = useState<ImportRow[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; count?: number; totalRows?: number } | null>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return

    // Validasi ekstensi
    if (!f.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Format file harus .xlsx, .xls, atau .csv')
      return
    }

    // Maksimal 5MB
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }

    setFile(f)
    setFileName(f.name)
    setResult(null)
    parseExcel(f)
  }, [])

  const parseExcel = async (f: File) => {
    try {
      const XLSX_MODULE = await import('xlsx')
      const XLSX = XLSX_MODULE.default || XLSX_MODULE
      const arrayBuffer = await f.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const firstSheet = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheet]
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet)

      if (!jsonData || jsonData.length === 0) {
        toast.error('File kosong atau tidak bisa dibaca')
        setPreview([])
        setColumns([])
        return
      }

      // Ambil kolom dari header
      const cols = jsonData.length > 0 ? Object.keys(jsonData[0]) : []
      setColumns(cols)

      // Normalisasi & filter
      const normalized = jsonData.map((row: any) => {
        const n: ImportRow = {}
        for (const key of Object.keys(row)) {
          const lower = key.trim().toLowerCase()
          const val = row[key]
          if (lower.includes('nama')) n.nama = String(val ?? '').trim()
          else if (lower.includes('kelas')) n.kelas = String(val ?? '').trim()
          else if (lower.includes('nis') || lower.includes('nisn')) n.nis = val
          else if (lower.includes('jabatan')) n.jabatan = String(val ?? '').trim()
        }
        return n
      }).filter((r: ImportRow) => r.nama && r.nama.length > 0)

      setPreview(normalized)
      toast.success(`Berhasil memuat ${normalized.length} baris dari ${jsonData.length} data`)
    } catch (err: any) {
      toast.error('Gagal membaca file: ' + err.message)
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast.error('Pilih file terlebih dahulu')
      return
    }
    if (!selectedOrg) {
      toast.error('Pilih organisasi terlebih dahulu')
      return
    }
    if (preview.length === 0) {
      toast.error('Tidak ada data untuk diimport')
      return
    }

    setSaving(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('org', selectedOrg)

    try {
      const res = await fetch('/api/import-excel', {
        method: 'POST',
        headers: {
          'x-user-id': user.id.toString(),
          'x-user-nama': user.nama,
          'x-user-role': user.role,
        },
        body: formData,
      })

      const json = await res.json()

      if (res.ok) {
        setResult({
          success: true,
          message: json.message || 'Import berhasil!',
          count: json.count,
          totalRows: json.totalRows,
        })
        toast.success(json.message || `${json.count} data berhasil diimport`)
      } else {
        setResult({ success: false, message: json.error || 'Import gagal' })
        toast.error(json.error || 'Import gagal')
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || 'Terjadi kesalahan' })
      toast.error(err.message || 'Terjadi kesalahan')
    } finally {
      setSaving(false)
      setFile(null)
      setFileName('')
      setPreview([])
      setColumns([])
    }
  }

  const handleReset = () => {
    setFile(null)
    setFileName('')
    setPreview([])
    setColumns([])
    setResult(null)
    // Reset file input
    const el = document.getElementById('excel-file-input') as HTMLInputElement
    if (el) el.value = ''
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">📥 Import Data Excel</h2>
          <p className="page-sub mt-0.5">Upload file Excel (.xlsx/.xls/.csv) untuk import data siswa atau anggota organisasi</p>
        </div>
      </div>

      {/* Instruksi */}
      <div className="card p-4 bg-white/5/40 border-white/10">
        <h3 className="text-sm font-bold text-blue-200 mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Panduan Format Excel
        </h3>
        <ul className="text-xs text-blue-300 space-y-1 ml-1">
          <li>• Kolom <strong>Nama</strong> wajib diisi (deteksi otomatis: "nama", "Nama Siswa", dll)</li>
          <li>• Kolom <strong>Kelas</strong> (opsional): contoh "X DKV", "XI RPL"</li>
          <li>• Kolom <strong>NIS</strong> (opsional): angka NIS/NISN</li>
          <li>• Kolom <strong>Jabatan</strong> (khusus OSIS/MPK, opsional): contoh "Ketua", "Wakil Ketua"</li>
          <li>• Nama kolom boleh apa saja — sistem otomatis mendeteksi berdasarkan kata kunci</li>
        </ul>
        <p className="text-xs text-blue-600 mt-2 italic">
          Contoh file tersedia di bawah ini untuk diunduh.
        </p>
      </div>

      {/* Pilih Organisasi */}
      <div className="card p-5">
        <label className="label">Pilih Organisasi / Ekskul *</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          {orgs.map((org) => (
            <button
              key={org}
              onClick={() => {
                setSelectedOrg(org)
                setResult(null)
              }}
              className={cn(
                'py-3 px-4 rounded-lg border text-center text-sm font-semibold transition-all',
                selectedOrg === org
                  ? 'border-persian-blue/100 bg-persian-blue/10 text-blue-300 ring-2 ring-persian-blue/20'
                  : 'border-white/10 bg-deep-navy text-slate-300 hover:border-white/20 hover:bg-white/5'
              )}
            >
              {ORG_LABELS[org]}
            </button>
          ))}
        </div>
      </div>

      {/* Upload Area */}
      <div className="card p-5">
        <label className="label mb-2">Upload File Excel *</label>
        <div
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
            file
              ? 'border-white/20 bg-green-500/10'
              : 'border-slate-300 hover:border-blue-400 hover:bg-white/5'
          )}
          onClick={() => document.getElementById('excel-file-input')?.click()}
        >
          <input
            id="excel-file-input"
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
          {file ? (
            <div className="space-y-2">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
              <p className="text-green-400 font-medium">{fileName}</p>
              <p className="text-xs text-slate-400">Klik untuk ganti file</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-slate-300">Klik untuk pilih file</p>
              <p className="text-xs text-slate-400 mt-1">Format: .xlsx, .xls, .csv (maks 5MB)</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Data */}
      {preview.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-200">
              <TableIcon className="w-4 h-4 inline mr-1" />
              Preview Data ({preview.length} baris)
            </h3>
            <button
              onClick={handleReset}
              className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Reset
            </button>
          </div>
          <div className="overflow-x-auto max-h-72 rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-white/10 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-slate-300 border-b">#</th>
                  <th className="px-3 py-2 text-left font-bold text-slate-300 border-b">Nama</th>
                  <th className="px-3 py-2 text-left font-bold text-slate-300 border-b">Kelas</th>
                  <th className="px-3 py-2 text-left font-bold text-slate-300 border-b">NIS</th>
                  <th className="px-3 py-2 text-left font-bold text-slate-300 border-b">Jabatan</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 50).map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white/5' : 'bg-transparent'}>
                    <td className="px-3 py-1.5 text-slate-400 border-b">{i + 1}</td>
                    <td className="px-3 py-1.5 font-medium border-b">{row.nama}</td>
                    <td className="px-3 py-1.5 text-slate-400 border-b">{row.kelas || '-'}</td>
                    <td className="px-3 py-1.5 text-slate-400 border-b">{row.nis || '-'}</td>
                    <td className="px-3 py-1.5 text-slate-400 border-b">{row.jabatan || '-'}</td>
                  </tr>
                ))}
                {preview.length > 50 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-2 text-center text-slate-400 text-xs italic border-b">
                      ... dan {preview.length - 50} baris lainnya tidak ditampilkan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Menampilkan maks 50 baris pertama dari {preview.length} data
          </p>
        </div>
      )}

      {/* Tombol Import */}
      <button
        onClick={handleImport}
        disabled={loading || saving || preview.length === 0 || !file}
        className="btn-primary w-full justify-center py-3 text-base"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Mengimport data...
          </>
        ) : loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Memproses file...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Import {preview.length} Data ke {ORG_LABELS[selectedOrg]}
          </>
        )}
      </button>
      <p className="text-center text-xs text-slate-400">
        Data duplikat (berdasarkan Nama + Kelas) akan dilewati
      </p>

      {/* Hasil Import */}
      {result && (
        <div
          className={cn(
            'p-4 rounded-lg border text-sm',
            result.success
              ? 'bg-green-500/10 border-white/10 text-green-400'
              : 'bg-red-500/10 border-white/10 text-red-400'
          )}
        >
          <div className="flex items-center gap-2 font-bold mb-1">
            {result.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {result.success ? 'Berhasil!' : 'Gagal!'}
          </div>
          <p>{result.message}</p>
          {result.count !== undefined && result.totalRows !== undefined && (
            <p className="mt-1 text-xs opacity-80">
              {result.count} dari {result.totalRows} data berhasil masuk ke database
            </p>
          )}
        </div>
      )}
    </div>
  )
}