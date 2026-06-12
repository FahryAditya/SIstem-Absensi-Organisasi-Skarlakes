'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import Table from '@/components/ui/Table'
import { StatusBadge } from '@/components/ui/Badges'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { clearJsonCache, fetchJsonCachedUrl } from '@/lib/client-cache'
import { ClipboardList, Save, Calendar, Loader2, CheckCircle2, XCircle, Clock, Heart, Banknote, Users } from 'lucide-react'
import { format } from 'date-fns'

interface Member { id: number; name: string; class: string | null }
interface AbsensiRow { member_id: number; nama: string; kelas: string | null; status: string; uang_kas: number; keterangan: string }
interface AbsensiRecord { id: number; member: Member; date: string; status: string; cash_amount: number; notes: string | null }

interface Props {
  user: { id: number; nama: string; email: string; role: string; activeOrgId?: number; orgIds: number[] }
}

const STATUS_OPTIONS = [
  { value: 'hadir', label: 'Hadir', icon: CheckCircle2, color: 'bg-green-500/10 text-green-400 border-white/20 hover:bg-green-100' },
  { value: 'tidak_hadir', label: 'Tidak', icon: XCircle, color: 'bg-red-500/10 text-red-400 border-red-300 hover:bg-red-100' },
  { value: 'izin', label: 'Izin', icon: Clock, color: 'bg-yellow-500/10 text-yellow-400 border-white/20 hover:bg-yellow-100' },
  { value: 'sakit', label: 'Sakit', icon: Heart, color: 'bg-sky-500/10 text-sky-400 border-white/20 hover:bg-sky-100' },
]

const PAGE_SIZE = 100

export default function AbsensiClient({ user }: Props) {
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<'input' | 'riwayat'>('input')

  // Input state
  const [bulkDate, setBulkDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [bulkRows, setBulkRows] = useState<AbsensiRow[]>([])
  const [loadingBulk, setLoadingBulk] = useState(false)
  const [saving, setSaving] = useState(false)

  // Riwayat state
  const [riwayat, setRiwayat] = useState<AbsensiRecord[]>([])
  const [loadingRiwayat, setLoadingRiwayat] = useState(false)
  const [filterTanggal, setFilterTanggal] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setMounted(true)
  }, [])

  const loadBulkData = useCallback(async () => {
    if (!user.activeOrgId) return
    setLoadingBulk(true)
    try {
      const json = await fetchJsonCachedUrl<{ data?: AbsensiRow[] }>(
        `/api/absensi?mode=input&tanggal=${bulkDate}`,
        { force: true }
      )
      setBulkRows(json.data || [])
    } catch (e) {
      toast.error('Gagal memuat data absensi')
    }
    setLoadingBulk(false)
  }, [user.activeOrgId, bulkDate])

  const loadRiwayat = useCallback(async (force = false, customParams?: any) => {
    if (!user.activeOrgId && user.role !== 'SUPER_ADMIN') return
    setLoadingRiwayat(true)
    const activePage = customParams?.page || page
    const activeTanggal = customParams?.tanggal !== undefined ? customParams.tanggal : filterTanggal

    const params = new URLSearchParams({
      page: String(activePage), 
      limit: String(PAGE_SIZE),
      ...(activeTanggal && { tanggal: activeTanggal }),
    })
    const json = await fetchJsonCachedUrl<{ data?: AbsensiRecord[]; total?: number; totalPages?: number }>(`/api/absensi?${params}`, { force })
    setRiwayat(json.data || [])
    setTotal(json.total || 0)
    setTotalPages(json.totalPages || 1)
    setLoadingRiwayat(false)
  }, [page, filterTanggal, user.activeOrgId, user.role])

  useEffect(() => { if (mode === 'input') loadBulkData() }, [mode, loadBulkData, user.activeOrgId])
  useEffect(() => { if (mode === 'riwayat') loadRiwayat() }, [mode, loadRiwayat, user.activeOrgId])

  function updateRow(idx: number, field: keyof AbsensiRow, value: string | number) {
    setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  function setAllStatus(status: string) {
    setBulkRows(prev => prev.map(r => ({ ...r, status })))
  }

  async function handleSave() {
    if (!bulkRows.length) { toast.error('Tidak ada anggota'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/absensi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal: bulkDate,
          rows: bulkRows.map(r => ({ member_id: r.member_id, status: r.status, uang_kas: r.uang_kas, keterangan: r.keterangan || undefined }))
        })
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error || 'Gagal menyimpan'); setSaving(false); return }
      toast.success(`✅ Absensi ${bulkRows.length} anggota tersimpan!`)
      
      clearJsonCache()
      setSaving(false)
      setFilterTanggal(bulkDate)
      setPage(1)
      setMode('riwayat')
    } catch (e) {
      toast.error('Terjadi kesalahan saat menyimpan')
      setSaving(false)
    }
  }

  const hadirCount = bulkRows.filter(r => r.status === 'hadir').length
  const totalKas = bulkRows.reduce((s, r) => s + (r.uang_kas || 0), 0)

  const riwayatCols = [
    { key: 'member', label: 'Nama Anggota', render: (a: AbsensiRecord) => (
      <div>
        <div className="font-semibold text-white text-sm">{a.member?.name}</div>
        <span className="text-xs text-slate-400">{a.member?.class || ''}</span>
      </div>
    )},
    { key: 'tanggal', label: 'Tanggal', render: (a: AbsensiRecord) => <span className="text-slate-400 text-xs font-mono">{formatDate(a.date)}</span> },
    { key: 'status', label: 'Status', render: (a: AbsensiRecord) => <StatusBadge status={a.status} /> },
    { key: 'uang_kas', label: 'Uang Kas', render: (a: AbsensiRecord) => (
      <span className={`font-mono text-sm font-semibold ${a.cash_amount > 0 ? 'text-green-600' : 'text-slate-300'}`}>
        {a.cash_amount > 0 ? formatCurrency(a.cash_amount) : '-'}
      </span>
    )},
    { key: 'keterangan', label: 'Keterangan', render: (a: AbsensiRecord) => <span className="text-slate-400 text-xs">{a.notes || '-'}</span> },
  ]

  if (!mounted) return null;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <ClipboardList className="w-5 h-5 text-persian-blue" />
            <h2 className="page-title">Absensi & Kas</h2>
          </div>
          <p className="page-sub mt-0.5">Manajemen kehadiran dan kas harian</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button onClick={() => setMode('input')} className={mode === 'input' ? 'btn-primary' : 'btn-secondary'}>
            <Save className="w-4 h-4" /> Input
          </button>
          <button onClick={() => setMode('riwayat')} className={mode === 'riwayat' ? 'btn-primary' : 'btn-secondary'}>
            <ClipboardList className="w-4 h-4" /> Riwayat
          </button>
        </div>
      </div>

      {mode === 'input' ? (
        <div className="space-y-4">
          <div className="card p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="date" value={bulkDate} onChange={e => setBulkDate(e.target.value)} className="input pl-10" />
            </div>
          </div>

          {!user.activeOrgId ? (
            <div className="card p-16 text-center">
              <p className="text-slate-400">Silakan pilih organisasi terlebih dahulu</p>
            </div>
          ) : loadingBulk ? (
            <div className="card p-16 flex items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Memuat daftar anggota...</span>
            </div>
          ) : bulkRows.length === 0 ? (
            <div className="card p-16 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">Belum ada anggota di organisasi ini</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b flex items-center justify-between flex-wrap gap-3 bg-white/5 border-white/10">
                <div>
                  <span className="text-sm font-bold text-white">Input Absensi — {formatDate(bulkDate)}</span>
                  <span className="text-xs text-white/50 ml-2">{bulkRows.length} orang</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s.value} onClick={() => setAllStatus(s.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${s.color}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="th w-8">#</th>
                      <th className="th">Nama Anggota</th>
                      <th className="th w-48">Status Kehadiran</th>
                      <th className="th w-36">Uang Kas (Rp)</th>
                      <th className="th w-40">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {bulkRows.map((row, i) => (
                      <tr key={row.member_id} className="hover:bg-white/5">
                        <td className="td text-slate-400 font-mono text-xs">{i + 1}</td>
                        <td className="td">
                          <div className="font-semibold text-white text-sm">{row.nama}</div>
                          {row.kelas && <div className="text-xs text-slate-400">{row.kelas}</div>}
                        </td>
                        <td className="td">
                          <div className="flex gap-1">
                            {STATUS_OPTIONS.map(s => {
                              const Icon = s.icon
                              return (
                                <button key={s.value} onClick={() => updateRow(i, 'status', s.value)}
                                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                    row.status === s.value ? s.color + ' ring-1 ring-current' : 'border-white/10 text-slate-400 hover:border-slate-300'
                                  }`}>
                                  <Icon className="w-3 h-3" />
                                  <span className="hidden sm:inline">{s.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        </td>
                        <td className="td">
                          <div className="relative">
                            <Banknote className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input type="number" min={0} step={500}
                              value={row.uang_kas}
                              onChange={e => updateRow(i, 'uang_kas', parseInt(e.target.value) || 0)}
                              className="input pl-8 py-1.5 font-mono text-sm" />
                          </div>
                        </td>
                        <td className="td">
                          <input type="text"
                            value={row.keterangan}
                            onChange={e => updateRow(i, 'keterangan', e.target.value)}
                            className="input py-1.5 text-xs w-full"
                            placeholder="Opsional..." />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-5 py-3 bg-white/5 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
                <div className="text-xs font-semibold text-amber-400">Total Kas: {formatCurrency(totalKas)}</div>
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : <><Save className="w-4 h-4" />Simpan Absensi</>}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="date" value={filterTanggal} onChange={e => setFilterTanggal(e.target.value)} className="input pl-10" />
            </div>
          </div>
          <Table
            columns={riwayatCols}
            data={riwayat}
            loading={loadingRiwayat}
            emptyMessage="Tidak ada data absensi"
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            rowKey={(a: AbsensiRecord) => a.id}
          />
        </div>
      )}
    </div>
  )
}
