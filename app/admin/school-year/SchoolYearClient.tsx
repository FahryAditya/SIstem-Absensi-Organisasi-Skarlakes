'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { GraduationCap, Users, ArrowRight, RotateCcw, Info, History, AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import CeremonyAnimation from './CeremonyAnimation'

interface OrgStat {
  total: number
  breakdown: { class: string; count: number }[]
}

interface StatsData {
  orgStats: {
    osis: OrgStat
    mpk: OrgStat
    programming: OrgStat
    english: OrgStat
  }
  graduates: {
    osis: { id: number; nama: string }[]
    mpk: { id: number; nama: string }[]
    programming: { id: number; nama: string }[]
    english: { id: number; nama: string }[]
  }
  recentProgression: any
}

export default function SchoolYearClient({ user }: { user: any }) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showCeremony, setShowCeremony] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  
  const [schoolYearFrom, setSchoolYearFrom] = useState('2025-2026')
  const [schoolYearTo, setSchoolYearTo] = useState('2026-2027')

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/school-year/stats')
      const json = await res.json()
      if (json.success) setStats(json.data)
      else toast.error(json.error || 'Gagal memuat statistik')
    } catch (e) {
      toast.error('Gagal memuat statistik')
    } finally {
      setLoading(false)
    }
  }

  async function fetchHistory() {
    try {
      setHistoryLoading(true)
      const res = await fetch('/api/admin/school-year/history')
      const json = await res.json()
      if (json.success) setHistory(json.data)
      else toast.error(json.error || 'Gagal memuat riwayat')
    } catch (e) {
      toast.error('Gagal memuat riwayat')
    } finally {
      setHistoryLoading(false)
    }
  }

  async function handleStartProgression() {
    setProcessing(true)
    try {
      const res = await fetch('/api/admin/school-year/progression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolYearFrom, schoolYearTo })
      })
      const json = await res.json()
      if (json.success) {
        setShowConfirm(false)
        setShowCeremony(true)
        fetchStats()
      } else {
        toast.error(json.error || 'Gagal memulai proses naik kelas')
      }
    } catch (e) {
      toast.error('Gagal memulai proses naik kelas')
    } finally {
      setProcessing(false)
    }
  }

  async function handleRollback(batchId: string) {
    if (!confirm('Apakah Anda yakin ingin melakukan rollback? Aksi ini akan mengembalikan data ke status sebelumnya.')) return
    
    try {
      const res = await fetch('/api/admin/school-year/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId })
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Rollback berhasil')
        fetchStats()
        fetchHistory()
      } else {
        toast.error(json.error || 'Gagal melakukan rollback')
      }
    } catch (e) {
      toast.error('Gagal melakukan rollback')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header & Warning */}
      <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Info className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tahun Ajaran Baru {schoolYearFrom} - {schoolYearTo}</h1>
            <p className="text-blue-700 mt-1">
              Aksi ini akan menaikkan kelas semua siswa (X → XI, XI → XII) dan men-declare kelas XII sebagai Purna Tugas.
              Dapat di-undo dalam waktu 48 jam.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Object.entries(stats?.orgStats || {}).map(([org, data]: [string, any]) => (
          <div key={org} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 uppercase">{org}</h3>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Total Anggota</span>
                <span className="font-bold">{data.total}</span>
              </div>
              <div className="pt-2 border-t space-y-2">
                {data.breakdown.map((b: any) => (
                  <div key={b.class} className="flex justify-between items-center text-xs">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">Kelas {b.class}</span>
                    <span className="font-medium text-gray-800">{b.count} orang</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Graduating Students Section */}
      <div className="bg-white border rounded-xl overflow-hidden mb-8 shadow-sm">
        <div className="p-5 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-orange-500" />
            Siswa yang akan Purna Tugas (Kelas XII)
          </h2>
          <span className="text-xs text-gray-500">
            Total: {Object.values(stats?.graduates || {}).reduce((sum, list) => sum + list.length, 0)} orang
          </span>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(stats?.graduates || {}).map(([org, list]) => (
            <div key={org}>
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">{org}</h4>
              <ul className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {list.length > 0 ? list.map((s: any) => (
                  <li key={s.id} className="text-sm text-gray-700 py-1 border-b border-gray-50 flex items-center gap-2">
                    <div className="w-1 h-1 bg-orange-400 rounded-full" />
                    {s.nama}
                  </li>
                )) : <li className="text-sm text-gray-400 italic">Tidak ada</li>}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4">
        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-200 transition-all transform hover:scale-105 active:scale-95"
        >
          <RotateCcw className="w-5 h-5" />
          Naik Kelas & Purna Tugas
        </button>
        <button
          onClick={() => { setHistoryOpen(true); fetchHistory(); }}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-8 py-3 rounded-full font-bold transition-all"
        >
          <History className="w-5 h-5 text-gray-500" />
          Lihat Riwayat
        </button>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={showConfirm} onClose={() => !processing && setShowConfirm(false)} title="Konfirmasi Naik Kelas">
        <div className="p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              Anda akan melakukan <strong>Class Progression</strong> untuk semua organisasi. 
              Aksi ini akan mengubah status kelas siswa secara permanen (namun bisa di-undo dalam 48 jam).
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Tahun Asal</div>
                <input 
                  type="text" 
                  value={schoolYearFrom} 
                  onChange={e => setSchoolYearFrom(e.target.value)}
                  className="w-full bg-transparent font-bold text-gray-800 border-b border-gray-300 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Tahun Baru</div>
                <input 
                  type="text" 
                  value={schoolYearTo} 
                  onChange={e => setSchoolYearTo(e.target.value)}
                  className="w-full bg-transparent font-bold text-gray-800 border-b border-gray-300 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={processing}
              className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Batal
            </button>
            <button
              onClick={handleStartProgression}
              disabled={processing}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              Lanjutkan
            </button>
          </div>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} title="Riwayat Naik Kelas">
        <div className="p-6">
          {historyLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white border-b">
                  <tr>
                    <th className="py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Tahun</th>
                    <th className="py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Stats</th>
                    <th className="py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Eksekutor</th>
                    <th className="py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50">
                      <td className="py-4">
                        <div className="font-bold text-gray-800">{h.school_year_from} → {h.school_year_to}</div>
                        <div className="text-xs text-gray-400">{formatDateTime(h.executed_at)}</div>
                      </td>
                      <td className="py-4">
                        <div className="text-xs text-green-600 font-medium">↑ {h.total_promoted} Promoted</div>
                        <div className="text-xs text-orange-600 font-medium">🎓 {h.total_graduated} Alumni</div>
                      </td>
                      <td className="py-4">
                        <div className="text-sm text-gray-700">{h.admin?.nama}</div>
                      </td>
                      <td className="py-4">
                        {h.status === 'COMPLETED' ? (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">SELESAI</span>
                        ) : (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">REVERTED</span>
                        )}
                      </td>
                      <td className="py-4">
                        {h.status === 'COMPLETED' && (new Date().getTime() - new Date(h.executed_at).getTime()) / (1000 * 60 * 60) <= 48 && (
                          <button
                            onClick={() => handleRollback(h.batch_id)}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg flex items-center gap-1 text-xs font-bold"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Undo
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr><td colSpan={5} className="py-12 text-center text-gray-400 italic">Belum ada riwayat</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* Ceremony Animation */}
      {showCeremony && stats && (
        <CeremonyAnimation 
          onClose={() => setShowCeremony(false)} 
          graduates={stats.graduates} 
          yearFrom={schoolYearFrom}
          yearTo={schoolYearTo}
        />
      )}
    </div>
  )
}
