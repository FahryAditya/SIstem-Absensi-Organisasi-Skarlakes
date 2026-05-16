'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Wallet, Loader2, RefreshCw } from 'lucide-react'
import { fetchJsonCachedUrl } from '@/lib/client-cache'
import AttendanceCharts from '@/components/charts/AttendanceCharts'
import FinanceCharts from '@/components/charts/FinanceCharts'
import KasSiswaCharts from '@/components/charts/KasSiswaCharts'

interface Props {
  user: { id: number; nama: string; email: string; role: string }
}

export default function ReportsClient({ user }: Props) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'attendance' | 'finance' | 'kas'>('attendance')

  useEffect(() => {
    fetchReportsData()
  }, [])

  async function fetchReportsData() {
    setLoading(true)
    try {
      const response = await fetchJsonCachedUrl<any>('/api/reports?type=all')
      setData(response)
    } catch (error) {
      console.error('Failed to fetch reports data:', error)
    }
    setLoading(false)
  }

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
            onClick={() => setActiveTab('finance')}
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
            onClick={() => setActiveTab('kas')}
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
      ) : data ? (
        <>
          {activeTab === 'attendance' && <AttendanceCharts data={data} />}
          {activeTab === 'finance' && <FinanceCharts data={data} />}
          {activeTab === 'kas' && <KasSiswaCharts data={data} />}
        </>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-sm text-slate-500">Gagal memuat data laporan</p>
        </div>
      )}
    </div>
  )
}
