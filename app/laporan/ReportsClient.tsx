'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart3, TrendingUp, Wallet, Loader2, RefreshCw, ShieldAlert, RefreshCcwDot } from 'lucide-react'
import AttendanceCharts from '@/components/charts/AttendanceCharts'
import FinanceCharts from '@/components/charts/FinanceCharts'
import KasSiswaCharts from '@/components/charts/KasSiswaCharts'

interface Props {
  user: { id: number; nama: string; email: string; role: string }
}

export default function ReportsClient({ user }: Props) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'attendance' | 'finance' | 'kas'>('attendance')

  const fetchReportsData = useCallback(async () => {
    setLoading(true)
    setAuthError(false)
    setServerError(null)
    try {
      const res = await fetch('/api/reports?type=all')
      const isUnauth = res.status === 401
      
      if (isUnauth) {
        setAuthError(true)
        setLoading(false)
        return
      }

      const json = await res.json().catch(() => ({ error: 'Gagal membaca respon server' }))

      if (!res.ok) {
        setServerError(json?.error || `Error ${res.status}: Terjadi kesalahan pada server`)
        setLoading(false)
        return
      }
      
      setData(json)
    } catch (error) {
      console.error('Failed to fetch reports data:', error)
      setServerError('Gagal terhubung ke server. Pastikan koneksi internet Anda stabil.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchReportsData()
  }, [fetchReportsData])

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <div className="flex items-center gap-2.5">
          <BarChart3 className="w-6 h-6 text-[#5482B4]" />
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Laporan Statistik</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">Visualisasi data kehadiran, keuangan, dan kas siswa dengan grafik animasi.</p>
      </div>

      {/* Tab Navigation */}
      <div className="card p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'attendance'
                ? 'bg-[#5482B4] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Kehadiran
          </button>
          <button
            onClick={() => {
              setActiveTab('finance')
              if (!data?.keuanganBulanan) fetchReportsData()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'finance'
                ? 'bg-[#5482B4] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Wallet className="w-4 h-4" />
            Keuangan
          </button>
          <button
            onClick={() => {
              setActiveTab('kas')
              if (!data?.kasSiswa) fetchReportsData()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'kas'
                ? 'bg-[#5482B4] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Kas Siswa
          </button>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchReportsData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh Data
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card p-12 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#5482B4] mx-auto mb-3" />
            <p className="text-sm text-slate-500">Memuat laporan...</p>
          </div>
        </div>
      ) : authError ? (
        <div className="card p-12 text-center">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-700 mb-1">Sesi habis atau akses ditolak</p>
          <p className="text-sm text-slate-500 mb-4">Silakan login ulang untuk melanjutkan.</p>
          <button
            onClick={() => { window.location.href = '/login' }}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RefreshCcwDot className="w-4 h-4" />
            Login Ulang
          </button>
        </div>
      ) : serverError ? (
        <div className="card p-12 text-center">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-700 mb-1">Gagal Memuat Data</p>
          <p className="text-sm text-slate-500 mb-4">{serverError}</p>
          <button
            onClick={fetchReportsData}
            className="btn-primary inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </button>
        </div>
      ) : data ? (
        <>
          {activeTab === 'attendance' && <AttendanceCharts data={data} />}
          {activeTab === 'finance' && <FinanceCharts data={data} />}
          {activeTab === 'kas' && <KasSiswaCharts data={data} />}
        </>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-sm text-slate-500">Tidak ada data untuk ditampilkan</p>
        </div>
      )}
    </div>
  )
}

