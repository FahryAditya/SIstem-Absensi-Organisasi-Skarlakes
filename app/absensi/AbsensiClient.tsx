'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import Table from '@/components/ui/Table'
import { StatusBadge, OrgBadge } from '@/components/ui/Badges'
import { cn, formatDate, formatCurrency, STATUS_LABELS } from '@/lib/utils'
import { canAccessProgramming, canAccessEnglish } from '@/lib/auth-shared'
import { clearJsonCache, fetchJsonCachedUrl } from '@/lib/client-cache'
import { ClipboardList, Save, Calendar, Filter, Loader2, CheckCircle2, XCircle, Clock, Heart, Banknote, Users, Sparkles, UserCheck } from 'lucide-react'
import { AWARDS_DATA } from '@/lib/awards'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import { format } from 'date-fns'


interface Siswa { id: number; nama: string; kelas: string | null; ekskul: string }
interface AbsensiRow { siswa_id: number; nama: string; kelas: string | null; ekskul: string; status: string; uang_kas: number; keterangan: string }
interface AbsensiRecord { id: number; siswa: Siswa; tanggal: string; status: string; uang_kas: number; keterangan: string | null; creator: { nama: string } }

interface Props {
  user: { id: number; nama: string; email: string; role: string }
  defaultOrg: 'programming' | 'english' | ''
}

const STATUS_OPTIONS = [
  { value: 'hadir', label: 'Hadir', icon: CheckCircle2, color: 'bg-green-500/10 text-green-400 border-white/20 hover:bg-green-100' },
  { value: 'tidak_hadir', label: 'Tidak', icon: XCircle, color: 'bg-red-500/10 text-red-400 border-red-300 hover:bg-red-100' },
  { value: 'izin', label: 'Izin', icon: Clock, color: 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100' },
  { value: 'sakit', label: 'Sakit', icon: Heart, color: 'bg-sky-500/10 text-sky-400 border-white/20 hover:bg-sky-100' },
]

const PAGE_SIZE = 100

export default function AbsensiClient({ user, defaultOrg }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [mode, setMode] = useState<'input' | 'riwayat'>('input')

  // Input state
  const [bulkOrg, setBulkOrg] = useState<'programming' | 'english'>(defaultOrg || (canAccessProgramming(user.role) ? 'programming' : 'english'))
  const [bulkDate, setBulkDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [bulkRows, setBulkRows] = useState<AbsensiRow[]>([])
  const [loadingBulk, setLoadingBulk] = useState(false)
  const [saving, setSaving] = useState(false)

  // Award state
  const [awardModalOpen, setAwardModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<{ id: number; nama: string; org: string } | null>(null)
  const [awardId, setAwardId] = useState<number | null>(null)
  const [givingAward, setGivingAward] = useState(false)

  // Riwayat state
  const [riwayat, setRiwayat] = useState<AbsensiRecord[]>([])
  const [loadingRiwayat, setLoadingRiwayat] = useState(false)
  const [filterTanggal, setFilterTanggal] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [filterOrg, setFilterOrg] = useState<string>(defaultOrg)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const canProg = canAccessProgramming(user.role)
  const canEng = canAccessEnglish(user.role)

  // Load siswa & absensi for bulk input (Optimized combined call)
  const loadBulkData = useCallback(async () => {
    setLoadingBulk(true)
    try {
      const json = await fetchJsonCachedUrl<{ data?: AbsensiRow[] }>(
        `/api/absensi?mode=input&tanggal=${bulkDate}&ekskul=${bulkOrg}`
      )
      setBulkRows(json.data || [])
    } catch (e) {
      toast.error('Gagal memuat data absensi')
    }
    setLoadingBulk(false)
  }, [bulkOrg, bulkDate])

  useEffect(() => { if (mode === 'input') loadBulkData() }, [mode, loadBulkData])

  // Load riwayat
  const loadRiwayat = useCallback(async (force = false) => {
    setLoadingRiwayat(true)
    const params = new URLSearchParams({
      page: String(page), limit: String(PAGE_SIZE),
      ...(filterTanggal && { tanggal: filterTanggal }),
      ...(filterOrg && { ekskul: filterOrg }),
    })
    const json = await fetchJsonCachedUrl<{ data?: AbsensiRecord[]; total?: number; totalPages?: number }>(`/api/absensi?${params}`, { force })
    setRiwayat(json.data || [])
    setTotal(json.total || 0)
    setTotalPages(json.totalPages || 1)
    setLoadingRiwayat(false)
  }, [page, filterTanggal, filterOrg])

  useEffect(() => { if (mode === 'riwayat') loadRiwayat() }, [mode, loadRiwayat])
  useEffect(() => { setPage(1) }, [filterTanggal, filterOrg])

  function updateRow(idx: number, field: keyof AbsensiRow, value: string | number) {
    setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  function setAllStatus(status: string) {
    setBulkRows(prev => prev.map(r => ({ ...r, status })))
  }

  async function handleSave() {
    if (!bulkRows.length) { toast.error('Tidak ada siswa'); return }
    setSaving(true)
    const res = await fetch('/api/absensi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tanggal: bulkDate,
        rows: bulkRows.map(r => ({ siswa_id: r.siswa_id, status: r.status, uang_kas: r.uang_kas, keterangan: r.keterangan || undefined }))
      })
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Gagal menyimpan'); setSaving(false); return }
    toast.success(`✅ Absensi ${bulkRows.length} siswa tersimpan!`, { duration: 4000 })
    
    // Clear cache to ensure next loads are fresh
    clearJsonCache()
    
    setSaving(false)
    
    // Switch to riwayat and ensure the date filter matches what we just saved
    setFilterTanggal(bulkDate)
    setFilterOrg(bulkOrg)
    setMode('riwayat')
    
    // We don't call loadRiwayat(true) here because the useEffect on mode/filter change 
    // will trigger it. Since we cleared the cache, it will fetch fresh data.
  }

  async function handleGiveAward() {
    if (!selectedStudent || !awardId) {
      toast.error('Pilih penghargaan terlebih dahulu')
      return
    }
    setGivingAward(true)
    const tipe = selectedStudent.org === 'osis' ? 'anggota_osis' : selectedStudent.org === 'mpk' ? 'anggota_mpk' : 'siswa'
    const res = await fetch('/api/pencapaian/berikan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pencapaian_id: awardId,
        penerima: [{ tipe_anggota: tipe, target_id: selectedStudent.id }]
      })
    })
    const json = await res.json()
    if (!res.ok) toast.error(json.error || 'Gagal')
    else {
      toast.success('Penghargaan berhasil diberikan')
      setAwardModalOpen(false)
    }
    setGivingAward(false)
  }

  const hadirCount = bulkRows.filter(r => r.status === 'hadir').length
  const tidakCount = bulkRows.filter(r => r.status === 'tidak_hadir').length
  const izinCount = bulkRows.filter(r => r.status === 'izin').length
  const sakitCount = bulkRows.filter(r => r.status === 'sakit').length
  const totalKas = bulkRows.reduce((s, r) => s + (r.uang_kas || 0), 0)

  const riwayatCols = [
    { key: 'siswa', label: 'Nama Siswa', render: (a: AbsensiRecord) => (
      <div>
        <div className="font-semibold text-white text-sm">{a.siswa?.nama}</div>
        <span className="text-xs text-slate-400">{a.siswa?.kelas || ''}</span>
      </div>
    )},
    { key: 'ekskul', label: 'Ekskul', render: (a: AbsensiRecord) => a.siswa ? <OrgBadge org={a.siswa.ekskul} /> : null },
    { key: 'tanggal', label: 'Tanggal', render: (a: AbsensiRecord) => <span className="text-slate-400 text-xs font-mono">{formatDate(a.tanggal)}</span> },
    { key: 'status', label: 'Status', render: (a: AbsensiRecord) => <StatusBadge status={a.status} /> },
    { key: 'uang_kas', label: 'Uang Kas', render: (a: AbsensiRecord) => (
      <span className={`font-mono text-sm font-semibold ${a.uang_kas > 0 ? 'text-green-600' : 'text-slate-300'}`}>
        {a.uang_kas > 0 ? formatCurrency(a.uang_kas) : '-'}
      </span>
    )},
    { key: 'keterangan', label: 'Keterangan', render: (a: AbsensiRecord) => <span className="text-slate-400 text-xs">{a.keterangan || '-'}</span> },
    { key: 'creator', label: 'Di-input oleh', render: (a: AbsensiRecord) => <span className="text-slate-400 text-xs">{a.creator?.nama || '-'}</span> },
  ]

  if (!mounted) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <ClipboardList className="w-5 h-5 text-persian-blue" />
            <h2 className="page-title">Absensi & Kas</h2>
          </div>
          <p className="page-sub mt-0.5">Input dan lihat riwayat absensi siswa ekskul</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button onClick={() => setMode('input')} className={mode === 'input' ? 'btn-primary' : 'btn-secondary'}>
            <Save className="w-4 h-4" /> Input
          </button>
          <button onClick={() => setMode('riwayat')} className={mode === 'riwayat' ? 'btn-primary' : 'btn-secondary'}>
            <ClipboardList className="w-4 h-4" /> Riwayat
          </button>
          {/* <button 
            onClick={() => window.location.href = `/admin/registration/acceptance?type=eskul&org=${bulkOrg}`}
            className="btn-secondary border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-600 font-bold"
          >
            <UserCheck className="w-4 h-4" />
            Lihat Calon Pendaftaran
          </button> */}
        </div>
      </div>

      {mode === 'input' ? (
        <div className="space-y-4">
          {/* Input controls */}
          <div className="card p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="date" value={bulkDate} onChange={e => setBulkDate(e.target.value)} className="input pl-10" />
            </div>
            {canProg && canEng && (
              <Select
                value={bulkOrg}
                onChange={v => setBulkOrg(v as 'programming' | 'english')}
                className="sm:w-48"
                options={[
                  ...(canProg ? [{ value: 'programming', label: 'Programming' }] : []),
                  ...(canEng  ? [{ value: 'english',     label: 'English Club' }] : []),
                ]}
              />
            )}
          </div>

          {loadingBulk ? (
            <div className="card p-16 flex items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Memuat daftar siswa...</span>
            </div>
          ) : bulkRows.length === 0 ? (
            <div className="card p-16 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">Belum ada siswa di ekskul ini</p>
              <p className="text-slate-400 text-xs mt-1">Tambahkan siswa terlebih dahulu di menu Data Siswa</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              {/* Bulk header */}
              <div className={cn(
                "px-5 py-3 border-b flex items-center justify-between flex-wrap gap-3",
                bulkOrg === 'programming' ? "bg-unit-programming/10 border-unit-programming/20" : "bg-unit-english/10 border-unit-english/20"
              )}>
                <div>
                  <span className={cn(
                    "text-sm font-bold",
                    bulkOrg === 'programming' ? "text-unit-programming" : "text-blue-400"
                  )}>
                    {bulkOrg === 'programming' ? 'Programming' : 'English Club'} — {formatDate(bulkDate)}
                  </span>
                  <span className="text-xs text-white/50 ml-2">{bulkRows.length} siswa</span>
                </div>
                {/* Quick actions */}
                <div className="flex gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-400 self-center mr-1">Tandai semua:</span>
                  {STATUS_OPTIONS.map(s => (
                    <button key={s.value} onClick={() => setAllStatus(s.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${s.color}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="th w-8">#</th>
                      <th className="th">Nama Siswa</th>
                      <th className="th w-48">Status Kehadiran</th>
                      <th className="th w-36">Uang Kas (Rp)</th>
                      <th className="th w-40">Keterangan</th>
                    </tr>
                  </thead>
                      <tbody className="divide-y divide-slate-100">
                    {bulkRows.map((row, i) => {
                      const statusOpt = STATUS_OPTIONS.find(s => s.value === row.status)
                      return (
                        <tr key={row.siswa_id} className="hover:bg-white/10">
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
                                    title={s.label}
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
                                className="input pl-8 py-1.5 font-mono text-sm"
                                placeholder="0" />
                            </div>
                          </td>
                          <td className="td flex gap-2">
                            <input type="text"
                              value={row.keterangan}
                              onChange={e => updateRow(i, 'keterangan', e.target.value)}
                              className="input py-1.5 text-xs flex-1"
                              placeholder="Opsional..." />
                            {/* <button onClick={() => { 
                              setSelectedStudent({ id: row.siswa_id, nama: row.nama, org: bulkOrg })
                              setAwardModalOpen(true) 
                            }} className="btn-icon text-yellow-500 hover:bg-yellow-50" title="Beri Penghargaan">
                              <Sparkles className="w-4 h-4" />
                            </button> */}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary footer */}
              <div className="px-5 py-3 bg-white/5 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-4 text-xs font-semibold flex-wrap">
                  <span className="text-green-400">✓ Hadir: {hadirCount}</span>
                  <span className="text-red-400">✗ Tidak: {tidakCount}</span>
                  <span className="text-yellow-400">⏱ Izin: {izinCount}</span>
                  <span className="text-sky-400">♥ Sakit: {sakitCount}</span>
                  <span className="text-amber-400">Kas: {formatCurrency(totalKas)}</span>
                </div>
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : <><Save className="w-4 h-4" />Simpan Absensi</>}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Riwayat */
        <div className="space-y-4">
          <div className="card p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="date" value={filterTanggal} onChange={e => setFilterTanggal(e.target.value)} className="input pl-10" />
            </div>
            {canProg && canEng && (
              <Select
                value={filterOrg}
                onChange={setFilterOrg}
                placeholder="Semua Ekskul"
                className="sm:w-44"
                options={[
                  ...(canProg ? [{ value: 'programming', label: 'Programming' }] : []),
                  ...(canEng  ? [{ value: 'english',     label: 'English Club' }] : []),
                ]}
              />
            )}
          </div>
          <Table
            columns={riwayatCols}
            data={riwayat}
            loading={loadingRiwayat}
            emptyMessage="Tidak ada data absensi untuk filter ini"
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            rowKey={(a: AbsensiRecord) => a.id}
          />
        </div>
      )}

      <Modal open={awardModalOpen} title="Beri Penghargaan" onClose={() => setAwardModalOpen(false)} size="md"
        footer={
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAwardModalOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={handleGiveAward} disabled={givingAward} className="btn-primary">
              {givingAward ? 'Mengirim...' : 'Berikan Penghargaan'}
            </button>
          </div>
        }>
        <div className="space-y-4">
          <p className="text-xs text-slate-400">Memberikan penghargaan kepada <b>{selectedStudent?.nama}</b></p>
          <div className="form-group">
            <label className="label">Jenis Penghargaan *</label>
            <Select
              value={awardId ? awardId.toString() : ''}
              onChange={(val) => setAwardId(parseInt(val))}
              options={AWARDS_DATA[bulkOrg]?.map(a => ({ value: a.id.toString(), label: a.nama })) || []}
              placeholder="Pilih Penghargaan"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
