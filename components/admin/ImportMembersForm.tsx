"use client"

import { useState } from 'react'
import { FileSpreadsheet, Upload, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react'
import { SessionUser, getAccessibleOrgs } from '@/lib/auth-shared'

interface ImportMembersFormProps {
  user: SessionUser
}

const ORG_OPTIONS = [
  { id: 'programming', label: 'Programming' },
  { id: 'english', label: 'English Club' },
  { id: 'osis', label: 'OSIS' },
  { id: 'mpk', label: 'MPK' },
]

export default function ImportMembersForm({ user }: ImportMembersFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [targetOrg, setTargetOrg] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [importSummary, setImportSummary] = useState<{ imported: number; failed: number; errors: any[] } | null>(null)

  const allowedOrgs = getAccessibleOrgs(user.role)
  const filteredOrgOptions = ORG_OPTIONS.filter(o => allowedOrgs.includes(o.id))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.name.endsWith('.xlsx')) {
        setFile(selectedFile)
        setMessage('')
        setMessageType('')
        setImportSummary(null)
      } else {
        setMessage('Hanya file Excel (.xlsx) yang diperbolehkan.')
        setMessageType('error')
        setFile(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setMessage('Silakan pilih file Excel terlebih dahulu.')
      setMessageType('error')
      return
    }
    if (!targetOrg) {
      setMessage('Silakan pilih organisasi tujuan.')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')
    setMessageType('')
    setImportSummary(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('organizationType', targetOrg)

    try {
      const res = await fetch('/api/members/import-excel', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat mengimpor.')
      }

      setImportSummary({
        imported: data.imported,
        failed: data.failed,
        errors: data.errors || [],
      })

      if (data.failed === 0) {
        setMessage(`Berhasil mengimpor ${data.imported} anggota!`)
        setMessageType('success')
        setFile(null)
      } else if (data.imported > 0) {
        setMessage(`Impor selesai sebagian. ${data.imported} anggota berhasil, ${data.failed} gagal.`)
        setMessageType('success')
        setFile(null)
      } else {
        setMessage('Impor gagal. Tidak ada anggota yang berhasil ditambahkan.')
        setMessageType('error')
      }
    } catch (err: any) {
      setMessage(err.message || 'Terjadi kesalahan sistem.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Pilih Organisasi Tujuan Impor
          </label>
          <select
            value={targetOrg}
            onChange={(e) => setTargetOrg(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            disabled={loading}
          >
            <option value="" className="bg-[#1e293b]">-- Pilih Organisasi --</option>
            {filteredOrgOptions.map((org) => (
              <option key={org.id} value={org.id} className="bg-[#1e293b]">
                {org.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            File Excel (.xlsx)
          </label>
          
          <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 hover:border-blue-500/50 hover:bg-white/[0.02] transition duration-200 relative group flex flex-col items-center justify-center text-center cursor-pointer">
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={loading}
            />
            
            <div className="p-4 rounded-full bg-blue-500/10 text-blue-400 group-hover:scale-110 transition duration-200 mb-3">
              {file ? <FileSpreadsheet className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
            </div>

            {file ? (
              <div>
                <p className="text-white font-medium text-sm max-w-xs truncate">{file.name}</p>
                <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-slate-300 text-sm font-medium">Klik atau seret file Excel ke sini</p>
                <p className="text-xs text-slate-400 mt-1">Hanya mendukung format .xlsx</p>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !file || !targetOrg}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Mengimpor data...
            </span>
          ) : (
            'Mulai Impor Data'
          )}
        </button>
      </form>

      {/* Message alerts */}
      {message && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border ${
          messageType === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {messageType === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}

      {/* Detailed Report */}
      {importSummary && (importSummary.imported > 0 || importSummary.failed > 0) && (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Laporan Hasil Impor</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-center">
              <p className="text-2xl font-bold text-emerald-400">{importSummary.imported}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Berhasil Ditambahkan</p>
            </div>
            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-center">
              <p className="text-2xl font-bold text-red-400">{importSummary.failed}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Gagal / Dilewati</p>
            </div>
          </div>

          {importSummary.errors.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Detail Kesalahan Impor:
              </p>
              <div className="max-h-48 overflow-y-auto border border-white/5 rounded-xl bg-white/[0.01] divide-y divide-white/[0.03]">
                {importSummary.errors.map((err, idx) => (
                  <div key={idx} className="p-3 text-xs flex items-start justify-between gap-3 text-left">
                    <span className="font-semibold text-slate-300 shrink-0">{err.row}</span>
                    <span className="text-red-400 text-right">{err.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
