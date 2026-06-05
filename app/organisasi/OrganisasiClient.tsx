'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import Table from '@/components/ui/Table'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { StatusBadge } from '@/components/ui/Badges'
import { cn, formatDate, formatCurrency, STATUS_LABELS } from '@/lib/utils'
import { canAccessOsis, canAccessMpk } from '@/lib/auth-shared'
import { clearJsonCachePrefix, fetchJsonCachedUrl, prefetchJsonCachedUrl } from '@/lib/client-cache'
import {
  Building2, Plus, Pencil, Trash2, Loader2, Save, Calendar,
  ClipboardList, CheckCircle2, XCircle, Clock, Heart, Banknote, Contact, Award, Mail, Image as ImageIcon
} from 'lucide-react'
import { format } from 'date-fns'

interface Anggota { id: number; nis: string | null; nama: string; kelas: string | null; email: string | null; foto_url: string | null; jabatan: string | null; xp?: number; level?: number }
interface AbsensiOrg { id: number; organisasi_type: string; anggota_osis_id?: number | null; anggota_mpk_id?: number | null; anggota_osis?: Anggota; anggota_mpk?: Anggota; tanggal: string; status: string; uang_kas: number; keterangan: string | null }
interface BulkRow { anggota_id: number; nama: string; jabatan: string | null; status: string; uang_kas: number; keterangan: string }
interface PencapaianItem { id: number; tanggal: string; pencapaian: { nama: string; deskripsi: string; exp_reward: number } }

const STATUS_OPTIONS = [
  { value: 'hadir', label: 'Hadir', icon: CheckCircle2, color: 'bg-green-500/10 text-green-400 border-white/20 hover:bg-green-100' },
  { value: 'tidak_hadir', label: 'Tidak', icon: XCircle, color: 'bg-red-500/10 text-red-400 border-red-300 hover:bg-red-100' },
  { value: 'izin', label: 'Izin', icon: Clock, color: 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100' },
  { value: 'sakit', label: 'Sakit', icon: Heart, color: 'bg-sky-500/10 text-sky-400 border-white/20 hover:bg-sky-100' },
]

interface Props {
  user: { id: number; nama: string; email: string; role: string }
  defaultOrg: 'osis' | 'mpk' | ''
}

const PAGE_SIZE = 15

export default function OrganisasiClient({ user, defaultOrg }: Props) {
  const [activeOrg, setActiveOrg] = useState<'osis' | 'mpk'>(defaultOrg || (canAccessOsis(user.role) ? 'osis' : 'mpk'))
  const [subTab, setSubTab] = useState<'anggota' | 'absensi'>('anggota')

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Anggota state
  const [anggota, setAnggota] = useState<Anggota[]>([])
  const [loadingAnggota, setLoadingAnggota] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Anggota | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Anggota | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [fNama, setFNama] = useState('')
  const [fNis, setFNis] = useState('')
  const [fTingkat, setFTingkat] = useState('')
  const [fJurusan, setFJurusan] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fFotoUrl, setFFotoUrl] = useState('')
  const [fJabatan, setFJabatan] = useState('Anggota')
  const [profileTarget, setProfileTarget] = useState<Anggota | null>(null)
  const [profileAchievements, setProfileAchievements] = useState<PencapaianItem[]>([])
  const [profileLoading, setProfileLoading] = useState(false)

  // Absensi state
  const [bulkDate, setBulkDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([])
  const [loadingBulk, setLoadingBulk] = useState(false)
  const [savingAbsensi, setSavingAbsensi] = useState(false)
  const [riwayat, setRiwayat] = useState<AbsensiOrg[]>([])
  const [loadingRiwayat, setLoadingRiwayat] = useState(false)
  const [absensiMode, setAbsensiMode] = useState<'input' | 'riwayat'>('input')
  const [filterTanggal, setFilterTanggal] = useState(format(new Date(), 'yyyy-MM-dd'))

  const canOsis = canAccessOsis(user.role)
  const canMpk = canAccessMpk(user.role)
  const anggotaRequestId = useRef(0)
  const bulkRequestId = useRef(0)
  const riwayatRequestId = useRef(0)

  const loadAnggota = useCallback(async () => {
    const requestId = ++anggotaRequestId.current
    const url = `/api/organisasi?tipe=${activeOrg}&page=${page}&limit=${PAGE_SIZE}`
    setLoadingAnggota(true)
    try {
      const json = await fetchJsonCachedUrl<{ data?: Anggota[]; total?: number; totalPages?: number }>(url, { ttlMs: 90_000 })
      if (requestId !== anggotaRequestId.current) return
      setAnggota(json.data || [])
      setTotal(json.total || 0)
      setTotalPages(json.totalPages || 1)
      if ((json.totalPages || 1) > page) {
        prefetchJsonCachedUrl(`/api/organisasi?tipe=${activeOrg}&page=${page + 1}&limit=${PAGE_SIZE}`, { ttlMs: 90_000 }).catch(() => {})
      }
    } catch (error: any) {
      if (requestId === anggotaRequestId.current) toast.error(error.message || 'Gagal memuat anggota')
    } finally {
      if (requestId === anggotaRequestId.current) setLoadingAnggota(false)
    }
  }, [activeOrg, page])

  useEffect(() => { if (subTab === 'anggota') loadAnggota() }, [subTab, loadAnggota])
  useEffect(() => { setPage(1) }, [activeOrg])

  const loadBulk = useCallback(async () => {
    const requestId = ++bulkRequestId.current
    setLoadingBulk(true)
    try {
      const [anggJson, absJson] = await Promise.all([
        fetchJsonCachedUrl<{ data?: Anggota[] }>(`/api/organisasi?tipe=${activeOrg}&limit=100`, { ttlMs: 90_000 }),
        fetchJsonCachedUrl<{ data?: AbsensiOrg[] }>(`/api/organisasi/absensi?organisasi=${activeOrg}&tanggal=${bulkDate}&limit=100`, { ttlMs: 30_000 }),
      ])
      if (requestId !== bulkRequestId.current) return
      const anggList: Anggota[] = anggJson.data || []
      const existing: AbsensiOrg[] = absJson.data || []

      const rows: BulkRow[] = anggList.map(a => {
        const ex = existing.find(e =>
          activeOrg === 'osis'
            ? (e.anggota_osis_id === a.id || e.anggota_osis?.id === a.id)
            : (e.anggota_mpk_id === a.id || e.anggota_mpk?.id === a.id)
        )
        return { anggota_id: a.id, nama: a.nama, jabatan: a.jabatan, status: ex?.status || 'hadir', uang_kas: ex?.uang_kas || 0, keterangan: ex?.keterangan || '' }
      })
      setBulkRows(rows)
    } catch (error: any) {
      if (requestId === bulkRequestId.current) toast.error(error.message || 'Gagal memuat absensi')
    } finally {
      if (requestId === bulkRequestId.current) setLoadingBulk(false)
    }
  }, [activeOrg, bulkDate])

  const loadRiwayat = useCallback(async () => {
    const requestId = ++riwayatRequestId.current
    setLoadingRiwayat(true)
    try {
      const json = await fetchJsonCachedUrl<{ data?: AbsensiOrg[] }>(`/api/organisasi/absensi?organisasi=${activeOrg}&tanggal=${filterTanggal}&limit=50`, { ttlMs: 30_000 })
      if (requestId !== riwayatRequestId.current) return
      setRiwayat(json.data || [])
    } catch (error: any) {
      if (requestId === riwayatRequestId.current) toast.error(error.message || 'Gagal memuat riwayat')
    } finally {
      if (requestId === riwayatRequestId.current) setLoadingRiwayat(false)
    }
  }, [activeOrg, filterTanggal])

  useEffect(() => {
    if (subTab === 'absensi') {
      if (absensiMode === 'input') loadBulk()
      else loadRiwayat()
    }
  }, [subTab, absensiMode, loadBulk, loadRiwayat])

  function openAdd() { setEditTarget(null); setFNama(''); setFNis(''); setFTingkat(''); setFJurusan(''); setFEmail(''); setFFotoUrl(''); setFJabatan('Anggota'); setModalOpen(true) }
  function openEdit(a: Anggota) { 
    setEditTarget(a); setFNama(a.nama); setFNis(a.nis || ''); 
    const kls = a.kelas || '';
    const parts = kls.split(' ');
    const t = ['X', 'XI', 'XII'].includes(parts[0]) ? parts[0] : '';
    setFTingkat(t);
    setFJurusan(t ? parts.slice(1).join(' ') : kls);
    setFEmail(a.email || '');
    setFFotoUrl(a.foto_url || '');
    setFJabatan(a.jabatan || 'Anggota'); setModalOpen(true) 
  }

  async function openProfile(a: Anggota) {
    setProfileTarget(a)
    setProfileLoading(true)
    try {
      const tipe = activeOrg === 'osis' ? 'anggota_osis' : 'anggota_mpk'
      const res = await fetch(`/api/pencapaian/anggota?tipe_anggota=${tipe}&target_id=${a.id}`)
      const json = await res.json()
      setProfileAchievements(json.data || [])
    } catch {
      setProfileAchievements([])
    } finally {
      setProfileLoading(false)
    }
  }

  async function handleSave() {
    if (!fNama.trim()) { toast.error('Nama wajib diisi'); return }
    if (!/^[a-zA-Z\s.']*$/.test(fNama)) {
      toast.error('Nama hanya boleh berisi huruf dan simbol . \'');
      return
    }
    setSaving(true)
    const finalKelas = `${fTingkat} ${fJurusan}`.trim()
    const body = { nama: fNama.trim(), nis: fNis || undefined, kelas: finalKelas || undefined, email: fEmail || undefined, foto_url: fFotoUrl || undefined, jabatan: fJabatan || undefined, tipe: activeOrg }
    const res = await fetch('/api/organisasi', {
      method: editTarget ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editTarget ? { id: editTarget.id, ...body } : body)
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Gagal'); setSaving(false); return }
    toast.success(editTarget ? 'Data diperbarui' : 'Anggota ditambahkan')
    clearJsonCachePrefix('/api/organisasi')
    setSaving(false); setModalOpen(false); loadAnggota()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/organisasi?id=${deleteTarget.id}&tipe=${activeOrg}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Gagal'); setDeleting(false); return }
    toast.success('Anggota dihapus')
    clearJsonCachePrefix('/api/organisasi')
    setDeleting(false); setDeleteTarget(null); loadAnggota()
  }

  function updateRow(i: number, field: keyof BulkRow, value: string | number) {
    setBulkRows(prev => prev.map((r, j) => j === i ? { ...r, [field]: value } : r))
  }
  function setAllStatus(s: string) { setBulkRows(prev => prev.map(r => ({ ...r, status: s }))) }

  async function handleSaveAbsensi() {
    if (!bulkRows.length) return
    setSavingAbsensi(true)
    const res = await fetch('/api/organisasi/absensi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organisasi: activeOrg, tanggal: bulkDate, rows: bulkRows.map(r => ({ anggota_id: r.anggota_id, status: r.status, uang_kas: r.uang_kas, keterangan: r.keterangan || undefined })) })
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Gagal'); setSavingAbsensi(false); return }
    toast.success(`Absensi ${activeOrg.toUpperCase()} tersimpan!`)
    clearJsonCachePrefix('/api/organisasi/absensi')
    setSavingAbsensi(false)
    setAbsensiMode('riwayat')
    setFilterTanggal(bulkDate)
  }

  const orgLabel = activeOrg === 'osis' ? 'OSIS' : 'MPK'
  const orgBgClass = activeOrg === 'osis' ? 'bg-unit-osis/10 border-unit-osis/20 text-blue-300' : 'bg-unit-mpk/10 border-unit-mpk/20 text-red-400'
  const hadirCount = bulkRows.filter(r => r.status === 'hadir').length
  const totalKasBulk = bulkRows.reduce((s, r) => s + r.uang_kas, 0)

  const anggotaCols = [
    { key: 'no', label: 'No', render: (a: Anggota) => <span className="text-slate-400 font-mono text-xs">{anggota.indexOf(a) + 1 + (page-1)*PAGE_SIZE}</span> },
    { key: 'nis', label: 'NIS', render: (a: Anggota) => <span className="font-mono text-xs text-slate-400">{a.nis || '-'}</span> },
    { key: 'nama', label: 'Nama', render: (a: Anggota) => (
      <button onClick={() => openProfile(a)} className="flex items-center gap-2 text-left">
        {a.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.foto_url} alt={a.nama} className="w-8 h-8 rounded-full object-cover border border-white/10" />
        ) : (
          <span className="w-8 h-8 rounded-full bg-persian-blue/10 text-blue-300 border border-persian-blue/20 flex items-center justify-center text-xs font-bold">{a.nama.charAt(0).toUpperCase()}</span>
        )}
        <span>
          <span className="block font-semibold text-white">{a.nama}</span>
          {a.email && <span className="block text-[10px] text-slate-400">{a.email}</span>}
        </span>
      </button>
    ) },
    { key: 'organisasi', label: 'Organisasi', render: () => <span className="badge border bg-white/5 text-slate-400 uppercase text-[10px] font-bold">{activeOrg}</span> },
    { key: 'kelas', label: 'Kelas', render: (a: Anggota) => <span className="text-xs text-slate-400">{a.kelas || '-'}</span> },
    { key: 'jabatan', label: 'Jabatan', render: (a: Anggota) => <span className="text-xs font-medium text-slate-300">{a.jabatan || '-'}</span> },
    { key: 'actions', label: '', render: (a: Anggota) => (
      <div className="flex gap-1">
        <button onClick={() => openProfile(a)} className="btn-icon text-emerald-500 hover:bg-emerald-500/10"><Award className="w-3.5 h-3.5" /></button>
        <button onClick={() => openEdit(a)} className="btn-icon text-blue-400 hover:bg-persian-blue/10"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={() => setDeleteTarget(a)} className="btn-icon text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ]

  if (!mounted) return null;

  return (
    <div className="space-y-5">
      {/* Header + org switcher */}
      <div className="page-header">
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-persian-blue/100" />
            <h2 className="page-title">{orgLabel}</h2>
            <span className={`badge border ${orgBgClass}`}>{orgLabel}</span>
          </div>
          <p className="page-sub mt-0.5">Manajemen anggota dan absensi {orgLabel}</p>
        </div>
        {/* Org switcher */}
        <div className="flex gap-2">
          {canOsis && <button onClick={() => setActiveOrg('osis')} className={activeOrg === 'osis' ? 'btn-primary' : 'btn-secondary'}>OSIS</button>}
          {canMpk && <button onClick={() => setActiveOrg('mpk')} className={activeOrg === 'mpk' ? 'btn-primary' : 'btn-secondary'}>MPK</button>}
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex gap-1 border-b border-white/10">
        {[{ key: 'anggota', label: 'Anggota', icon: Building2 }, { key: 'absensi', label: 'Absensi & Kas', icon: ClipboardList }].map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key as 'anggota' | 'absensi')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              subTab === t.key ? 'border-persian-blue text-persian-blue' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {subTab === 'anggota' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" />Tambah Anggota</button>
          </div>
          <Table columns={anggotaCols} data={anggota} loading={loadingAnggota}
            emptyMessage={`Belum ada anggota ${orgLabel}`} page={page} totalPages={totalPages} total={total} onPageChange={setPage} rowKey={(a: Anggota) => a.id} />

          <Modal open={modalOpen} title={editTarget ? `Edit Anggota ${orgLabel}` : `Tambah Anggota ${orgLabel}`}
            onClose={() => setModalOpen(false)} size="md"
            footer={<div className="flex gap-2 justify-end"><button onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button><button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? <><Loader2 className="w-4 h-4 animate-spin"/>Simpan...</> : 'Simpan'}</button></div>}>
            <div className="space-y-4">
              <div className="form-group">
                <label className="label">Nama Lengkap *</label>
                <input 
                  value={fNama} 
                  onChange={e => setFNama(e.target.value)} 
                  placeholder="Nama lengkap anggota (Hanya Huruf)" 
                  className="input" 
                  autoFocus 
                />
              </div>
              <div className="form-group">
                <label className="label">NIS</label>
                <div className="relative">
                  <Contact className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    value={fNis} 
                    onChange={e => {
                      const val = e.target.value
                      if (val && !/^\d*$/.test(val)) {
                        toast.error('NIS hanya boleh berisi angka', { id: 'nis-error' })
                        return
                      }
                      setFNis(val)
                    }} 
                    placeholder="Opsional (Hanya Angka)" 
                    className="input pl-9 font-mono" 
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Email Anggota</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={fEmail}
                    onChange={e => setFEmail(e.target.value)}
                    placeholder="Opsional untuk notifikasi"
                    className="input pl-9"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="label">URL Foto</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={fFotoUrl}
                    onChange={e => setFFotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="input pl-9"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Tingkat & Kejuruan</label>
                <div className="flex gap-3">
                  <select value={fTingkat} onChange={e => setFTingkat(e.target.value)} className="input sm:w-32 w-28 cursor-pointer font-medium text-slate-200">
                    <option value="" disabled>Tingkat</option>
                    <option value="X">Kelas X</option>
                    <option value="XI">Kelas XI</option>
                    <option value="XII">Kelas XII</option>
                  </select>
                  <select value={fJurusan} onChange={e => setFJurusan(e.target.value)} className="input flex-1 cursor-pointer font-medium text-slate-200">
                    <option value="" disabled>Pilih Kejuruan...</option>
                    <option value="AKL">AKL</option>
                    <option value="PPLG">PPLG</option>
                    <option value="TJKT 1">TJKT 1</option>
                    <option value="TJKT 2">TJKT 2</option>
                    <option value="DKV">DKV</option>
                    <option value="MPLB 1">MPLB 1</option>
                    <option value="MPLB 2">MPLB 2</option>
                    <option value="FKK">FKK</option>
                    <option value="TLM">TLM</option>
                    <option value="AKC 1">AKC 1</option>
                    <option value="AKC 2">AKC 2</option>
                    <option value="AKC 3">AKC 3</option>
                    <option value="AKC 4">AKC 4</option>
                    <option value="AKC 5">AKC 5</option>
                    <option value="AKC 6">AKC 6</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="label">Jabatan</label>
                <select value={fJabatan} onChange={e => setFJabatan(e.target.value)} className="input cursor-pointer font-medium text-slate-200">
                  <option value="Anggota">Anggota</option>
                  <option value="Ketua">Ketua</option>
                  <option value="Wakil">Wakil</option>
                  <option value="Sekertaris 1">Sekertaris 1</option>
                  <option value="Sekertaris 2">Sekertaris 2</option>
                  <option value="Bendahara 1">Bendahara 1</option>
                  <option value="Bendahara 2">Bendahara 2</option>
                </select>
              </div>
            </div>
          </Modal>

          <ConfirmDialog open={!!deleteTarget} title={`Hapus Anggota ${orgLabel}?`}
            message={`"${deleteTarget?.nama}" akan dihapus beserta semua riwayat absensinya.`}
            loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />

          <Modal open={!!profileTarget} title={`Profil ${orgLabel}`} onClose={() => setProfileTarget(null)} size="md">
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                {profileTarget?.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profileTarget.foto_url} alt={profileTarget.nama} className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-persian-blue/10 text-blue-300 border border-persian-blue/20 flex items-center justify-center text-2xl font-black">
                    {profileTarget?.nama.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-white">{profileTarget?.nama}</h3>
                  <p className="text-xs text-slate-400">{profileTarget?.kelas || '-'} · {profileTarget?.jabatan || '-'}</p>
                  <p className="text-xs text-slate-400">{profileTarget?.email || 'Email belum diisi'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[10px] uppercase font-bold text-slate-400">EXP</p>
                  <p className="text-lg font-black text-white">{profileTarget?.xp || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Level</p>
                  <p className="text-lg font-black text-white">Lv {profileTarget?.level || 1}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <h4 className="text-sm font-bold text-white">Pencapaian</h4>
                </div>
                {profileLoading ? (
                  <div className="text-sm text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Memuat...</div>
                ) : profileAchievements.length === 0 ? (
                  <p className="text-sm text-slate-400">Belum ada pencapaian.</p>
                ) : (
                  <div className="space-y-2">
                    {profileAchievements.map(item => (
                      <div key={item.id} className="rounded-xl border border-amber-100 bg-amber-500/10/60 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-bold text-white">{item.pencapaian.nama}</p>
                          <span className="text-xs font-bold text-amber-400">+{item.pencapaian.exp_reward} EXP</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{item.pencapaian.deskripsi}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Modal>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setAbsensiMode('input')} className={absensiMode === 'input' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}><Save className="w-3.5 h-3.5" />Input</button>
            <button onClick={() => setAbsensiMode('riwayat')} className={absensiMode === 'riwayat' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}><ClipboardList className="w-3.5 h-3.5" />Riwayat</button>
          </div>

          {absensiMode === 'input' ? (
            <div className="space-y-3">
              <div className="card p-4 flex gap-3">
                <div className="relative flex-1"><Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="date" value={bulkDate} onChange={e => setBulkDate(e.target.value)} className="input pl-10" /></div>
              </div>
              {loadingBulk ? (
                <div className="card p-16 flex items-center justify-center gap-3 text-slate-400"><Loader2 className="w-5 h-5 animate-spin"/><span className="text-sm">Memuat...</span></div>
              ) : bulkRows.length === 0 ? (
                <div className="card p-16 text-center text-slate-400 text-sm">Belum ada anggota {orgLabel}</div>
              ) : (
                <div className="card overflow-hidden">
                  <div className={cn(
                    "px-5 py-3 border-b flex items-center justify-between flex-wrap gap-2",
                    activeOrg === 'osis' ? "bg-unit-osis/10 border-unit-osis/20" : "bg-unit-mpk/10 border-unit-mpk/20"
                  )}>
                    <span className={cn(
                      "text-sm font-bold",
                      activeOrg === 'osis' ? "text-unit-osis" : "text-unit-mpk"
                    )}>{orgLabel} — {formatDate(bulkDate)}</span>
                    <div className="flex gap-1 flex-wrap">
                      <span className="text-xs text-slate-400 self-center">Tandai semua:</span>
                      {STATUS_OPTIONS.map(s => <button key={s.value} onClick={() => setAllStatus(s.value)} className={`text-xs font-semibold px-2 py-1 rounded-lg border ${s.color}`}>{s.label}</button>)}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="bg-white/5 border-b border-white/10"><th className="th">#</th><th className="th">Nama</th><th className="th">Jabatan</th><th className="th w-48">Status</th><th className="th w-32">Kas (Rp)</th><th className="th w-36">Keterangan</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {bulkRows.map((row, i) => (
                          <tr key={row.anggota_id} className="hover:bg-white/10">
                            <td className="td text-slate-400 font-mono text-xs">{i+1}</td>
                            <td className="td font-semibold text-white text-sm">{row.nama}</td>
                            <td className="td text-xs text-slate-400">{row.jabatan || '-'}</td>
                            <td className="td">
                              <div className="flex gap-1">
                                {STATUS_OPTIONS.map(s => { const Icon=s.icon; return (
                                  <button key={s.value} onClick={() => updateRow(i,'status',s.value)} title={s.label}
                                    className={`flex items-center gap-1 px-1.5 py-1 rounded-lg border text-xs font-semibold transition-all ${row.status===s.value?s.color+' ring-1 ring-current':'border-white/10 text-slate-300 hover:border-slate-300'}`}>
                                    <Icon className="w-3 h-3"/><span className="hidden sm:inline">{s.label}</span>
                                  </button>
                                )})}
                              </div>
                            </td>
                            <td className="td"><div className="relative"><Banknote className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400"/><input type="number" min={0} step={500} value={row.uang_kas} onChange={e => updateRow(i,'uang_kas',parseInt(e.target.value)||0)} className="input pl-7 py-1.5 font-mono text-sm" placeholder="0"/></div></td>
                            <td className="td"><input type="text" value={row.keterangan} onChange={e => updateRow(i,'keterangan',e.target.value)} className="input py-1.5 text-xs" placeholder="Opsional..."/></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-5 py-3 bg-white/5 border-t flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex gap-4 text-xs font-semibold">
                      <span className="text-green-400">✓ Hadir: {hadirCount}</span>
                      <span className="text-slate-400">Total: {bulkRows.length}</span>
                      <span className="text-amber-400">Kas: {formatCurrency(totalKasBulk)}</span>
                    </div>
                    <button onClick={handleSaveAbsensi} disabled={savingAbsensi} className="btn-primary">
                      {savingAbsensi ? <><Loader2 className="w-4 h-4 animate-spin"/>Menyimpan...</> : <><Save className="w-4 h-4"/>Simpan Absensi</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="card p-4 flex gap-3"><div className="relative flex-1"><Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input type="date" value={filterTanggal} onChange={e => setFilterTanggal(e.target.value)} className="input pl-10"/></div></div>
              {loadingRiwayat ? (
                <div className="card p-16 flex items-center justify-center gap-3 text-slate-400"><Loader2 className="w-5 h-5 animate-spin"/><span className="text-sm">Memuat...</span></div>
              ) : riwayat.length === 0 ? (
                <div className="card p-16 text-center text-slate-400 text-sm">Tidak ada data absensi</div>
              ) : (
                <div className="card overflow-hidden overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="bg-white/5 border-b border-white/10"><th className="th">Nama</th><th className="th">Organisasi</th><th className="th">Jabatan</th><th className="th">Tanggal</th><th className="th">Status</th><th className="th">Uang Kas</th><th className="th">Keterangan</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {riwayat.map(a => {
                        const angg = activeOrg === 'osis' ? a.anggota_osis : a.anggota_mpk
                        return (
                          <tr key={a.id} className="hover:bg-white/5">
                            <td className="td font-semibold text-white">{angg?.nama || '-'}</td>
                            <td className="td text-[10px] font-bold text-slate-400 uppercase">{activeOrg}</td>
                            <td className="td text-xs text-slate-400">{angg?.jabatan || '-'}</td>
                            <td className="td text-xs font-mono text-slate-400">{formatDate(a.tanggal)}</td>
                            <td className="td"><StatusBadge status={a.status}/></td>
                            <td className="td font-mono text-sm font-semibold text-green-600">{a.uang_kas > 0 ? formatCurrency(a.uang_kas) : '-'}</td>
                            <td className="td text-xs text-slate-400">{a.keterangan || '-'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
