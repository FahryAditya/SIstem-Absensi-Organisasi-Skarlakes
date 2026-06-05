'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import Table from '@/components/ui/Table'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { OrgBadge } from '@/components/ui/Badges'
import { formatDate } from '@/lib/utils'
import { canManageSiswaData } from '@/lib/auth-shared'
import { clearJsonCache, fetchJsonCachedUrl } from '@/lib/client-cache'
import { useDebounce } from '@/lib/hooks'
import { Plus, Search, Pencil, Trash2, Users, Loader2, Contact, Zap, Award, Mail, Image as ImageIcon } from 'lucide-react'
import Select from '@/components/ui/Select'
import { LevelBadge } from '@/components/ui/LevelBadge'
import { ExpProgressBar } from '@/components/ui/ExpProgressBar'

const TINGKAT_OPTIONS = [
  { value: 'X', label: 'Kelas X' },
  { value: 'XI', label: 'Kelas XI' },
  { value: 'XII', label: 'Kelas XII' },
]
const JURUSAN_OPTIONS = [
  { value: 'AKL', label: 'AKL' }, { value: 'PPLG', label: 'PPLG' },
  { value: 'TJKT 1', label: 'TJKT 1' }, { value: 'TJKT 2', label: 'TJKT 2' },
  { value: 'DKV', label: 'DKV' }, { value: 'MPLB 1', label: 'MPLB 1' },
  { value: 'MPLB 2', label: 'MPLB 2' }, { value: 'FKK', label: 'FKK' },
  { value: 'TLM', label: 'TLM' }, { value: 'AKC 1', label: 'AKC 1' },
  { value: 'AKC 2', label: 'AKC 2' }, { value: 'AKC 3', label: 'AKC 3' },
  { value: 'AKC 4', label: 'AKC 4' }, { value: 'AKC 5', label: 'AKC 5' },
  { value: 'AKC 6', label: 'AKC 6' },
]

interface Siswa {
  id: number; nis: string | null; nama: string; kelas: string | null; email: string | null; foto_url: string | null; ekskul: string; created_at: string; xp: number; level: number
}

interface PencapaianItem {
  id: number
  tanggal: string
  pencapaian: { icon: string; nama: string; deskripsi: string; exp_reward: number }
}

interface Props {
  user: { id: number; nama: string; email: string; role: string }
  defaultOrg: 'programming' | 'english' | ''
}

const PAGE_SIZE = 15

export default function SiswaClient({ user, defaultOrg }: Props) {
  const [data, setData] = useState<Siswa[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [orgFilter, setOrgFilter] = useState<string>(defaultOrg)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Siswa | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Siswa | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Bulk delete state
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([])
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)

  // XP awarding states
  const [xpModalTarget, setXpModalTarget] = useState<Siswa | null>(null)
  const [fXpAmount, setFXpAmount] = useState<number>(20)
  const [fXpActivity, setFXpActivity] = useState<'tugas' | 'proyek' | 'manual'>('tugas')
  const [xpSaving, setXpSaving] = useState(false)

  // Form state
  const [fNama, setFNama] = useState('')
  const [fNis, setFNis] = useState('')
  const [fTingkat, setFTingkat] = useState('')
  const [fJurusan, setFJurusan] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fFotoUrl, setFFotoUrl] = useState('')
  const [fEkskul, setFEkskul] = useState<'programming' | 'english'>('programming')
  const [profileTarget, setProfileTarget] = useState<Siswa | null>(null)
  const [profileAchievements, setProfileAchievements] = useState<PencapaianItem[]>([])
  const [profileLoading, setProfileLoading] = useState(false)

  const canUseEkskulDropdown = canManageSiswaData(user.role)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(orgFilter && { ekskul: orgFilter }),
    })
    
    try {
      const json = await fetchJsonCachedUrl<{ data?: Siswa[]; total?: number; totalPages?: number }>(`/api/siswa?${params}`)
      setData(json.data || [])
      setTotal(json.total || 0)
      setTotalPages(json.totalPages || 1)
    } catch (e: any) {
      toast.error(e?.message || 'Gagal memuat data siswa')
    }
    setLoading(false)
  }, [page, debouncedSearch, orgFilter])

  useEffect(() => { load() }, [load])
  
  useEffect(() => { 
    setPage(1)
    setSelectedIds([]) 
  }, [debouncedSearch, orgFilter])
  
  useEffect(() => { setSelectedIds([]) }, [page])

  const openAdd = useCallback(() => {
    setEditTarget(null)
    setFNama(''); setFNis(''); setFTingkat(''); setFJurusan(''); setFEmail(''); setFFotoUrl('')
    setFEkskul(defaultOrg || 'programming')
    setModalOpen(true)
  }, [defaultOrg])

  const openEdit = useCallback((s: Siswa) => {
    setEditTarget(s)
    setFNama(s.nama); setFNis(s.nis || '')
    const kls = s.kelas || ''
    const parts = kls.split(' ')
    const t = ['X', 'XI', 'XII'].includes(parts[0]) ? parts[0] : ''
    setFTingkat(t)
    setFJurusan(t ? parts.slice(1).join(' ') : kls)
    setFEmail(s.email || '')
    setFFotoUrl(s.foto_url || '')
    setFEkskul(s.ekskul as 'programming' | 'english')
    setModalOpen(true)
  }, [])

  const openProfile = useCallback(async (s: Siswa) => {
    setProfileTarget(s)
    setProfileLoading(true)
    try {
      const res = await fetch(`/api/pencapaian/anggota?tipe_anggota=siswa&target_id=${s.id}`)
      const json = await res.json()
      setProfileAchievements(json.data || [])
    } catch {
      setProfileAchievements([])
    } finally {
      setProfileLoading(false)
    }
  }, [])

  const handleSave = useCallback(async () => {
    if (!fNama.trim()) { toast.error('Nama wajib diisi'); return }
    if (!/^[a-zA-Z\s.']*$/.test(fNama)) {
      toast.error('Nama hanya boleh berisi huruf dan simbol . \'');
      return
    }
    setSaving(true)
    const finalKelas = `${fTingkat} ${fJurusan}`.trim()
    const body = {
      nama: fNama.trim(),
      nis: fNis.trim() || undefined,
      kelas: finalKelas || undefined,
      email: fEmail.trim() || undefined,
      foto_url: fFotoUrl.trim() || undefined,
      ekskul: fEkskul,
    }
    const res = await fetch('/api/siswa', {
      method: editTarget ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editTarget ? { id: editTarget.id, ...body } : body),
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Gagal menyimpan'); setSaving(false); return }
    toast.success(editTarget ? 'Data siswa diperbarui' : 'Siswa berhasil ditambahkan')
    clearJsonCache()
    setSaving(false); setModalOpen(false); load()
  }, [fNama, fNis, fTingkat, fJurusan, fEmail, fFotoUrl, fEkskul, editTarget, load])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/siswa?id=${deleteTarget.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Gagal menghapus'); setDeleting(false); return }
    toast.success('Siswa dihapus')
    clearJsonCache()
    setDeleting(false); setDeleteTarget(null); load()
  }, [deleteTarget, load])

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return
    setBulkDeleting(true)
    const res = await fetch(`/api/siswa?ids=${selectedIds.join(',')}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Gagal menghapus'); setBulkDeleting(false); return }
    toast.success(`${selectedIds.length} data siswa dihapus`)
    clearJsonCache()
    setBulkDeleting(false); setBulkDeleteConfirmOpen(false); setSelectedIds([]); load()
  }, [selectedIds, load])

  const openXpModal = useCallback((s: Siswa) => {
    setXpModalTarget(s)
    setFXpAmount(20)
    setFXpActivity('tugas')
  }, [])

  const handleAwardXp = useCallback(async () => {
    if (!xpModalTarget) return
    setXpSaving(true)
    try {
      const res = await fetch('/api/siswa/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siswaId: xpModalTarget.id,
          xpToAdd: fXpAmount,
          activity: fXpActivity
        })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal memberikan XP')
      toast.success(`Berhasil memberikan +${fXpAmount} XP ke ${xpModalTarget.nama}`)
      setXpModalTarget(null)
      clearJsonCache()
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
    setXpSaving(false)
  }, [xpModalTarget, fXpAmount, fXpActivity, load])

  const columns = useMemo(() => [
    { key: 'no', label: 'No', render: (s: Siswa) => {
      const idx = data.indexOf(s)
      return <span className="text-slate-400 font-mono text-xs">{(page - 1) * PAGE_SIZE + idx + 1}</span>
    }},
    { key: 'nis', label: 'NIS', render: (s: Siswa) => <span className="font-mono text-xs text-slate-400">{s.nis || '-'}</span> },
    { key: 'nama', label: 'Nama Siswa', render: (s: Siswa) => (
      <button onClick={() => openProfile(s)} className="flex items-center gap-2 text-left">
        {s.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.foto_url} alt={s.nama} className="w-8 h-8 rounded-full object-cover border border-white/10" />
        ) : (
          <span className="w-8 h-8 rounded-full bg-persian-blue/10 text-blue-300 border border-persian-blue/20 flex items-center justify-center text-xs font-bold">
            {s.nama.charAt(0).toUpperCase()}
          </span>
        )}
        <span>
          <span className="block font-semibold text-white">{s.nama}</span>
          {s.email && <span className="block text-[10px] text-slate-400">{s.email}</span>}
        </span>
      </button>
    ) },
    { key: 'kelas', label: 'Kelas', render: (s: Siswa) => <span className="text-slate-400 text-xs">{s.kelas || '-'}</span> },
    { key: 'ekskul', label: 'Ekskul', render: (s: Siswa) => <OrgBadge org={s.ekskul} /> },
    { key: 'xp', label: 'Level & Progress', render: (s: Siswa) => (
      <div className="flex flex-col gap-1.5 max-w-[170px] min-w-[140px]">
        <div className="flex justify-between items-center">
          <LevelBadge exp={s.xp || 0} size="sm" />
          <span className="font-mono text-[10px] font-bold text-blue-300">{s.xp || 0} EXP</span>
        </div>
        <ExpProgressBar exp={s.xp || 0} showLabels={false} />
      </div>
    )},
    { key: 'created_at', label: 'Terdaftar', render: (s: Siswa) => <span className="text-slate-400 text-xs">{formatDate(s.created_at)}</span> },
    {
      key: 'actions', label: '',
      render: (s: Siswa) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openProfile(s)} className="btn-icon text-emerald-500 hover:bg-emerald-500/10" title="Profil & Pencapaian"><Award className="w-3.5 h-3.5" /></button>
          <button onClick={() => openXpModal(s)} className="btn-icon text-amber-500 hover:bg-amber-500/10" title="Beri Poin XP"><Zap className="w-3.5 h-3.5" /></button>
          <button onClick={() => openEdit(s)} className="btn-icon text-persian-blue/100 hover:bg-persian-blue/10"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleteTarget(s)} className="btn-icon text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      )
    },
  ], [data, page, openEdit, openXpModal, openProfile])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-persian-blue/100" />
            <h2 className="page-title">Data Siswa</h2>
            <span className="badge bg-persian-blue/10 text-blue-300 border border-persian-blue/20">{total} siswa</span>
          </div>
          <p className="page-sub mt-0.5">Kelola daftar siswa ekstrakurikuler</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button onClick={() => setBulkDeleteConfirmOpen(true)} className="btn-secondary text-red-600 border-white/10 hover:bg-red-500/10">
              <Trash2 className="w-4 h-4" /> Hapus Terpilih ({selectedIds.length})
            </button>
          )}
          <button onClick={openAdd} className="btn-primary">
            <Plus className="w-4 h-4" /> Tambah Siswa
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama atau NIS siswa..." className="input pl-10" />
        </div>
        {canUseEkskulDropdown && (
          <Select
            value={orgFilter}
            onChange={setOrgFilter}
            placeholder="Semua Ekskul"
            className="sm:w-44"
            options={[
              { value: 'programming', label: 'Programming' },
              { value: 'english', label: 'English Club' },
            ]}
          />
        )}
      </div>

      {/* Table */}
      <Table
        columns={columns as Parameters<typeof Table>[0]['columns']}
        data={data}
        loading={loading}
        emptyMessage="Belum ada siswa terdaftar"
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        rowKey={s => (s as Siswa).id}
        selectable
        selectedKeys={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {/* Modal */}
      <Modal
        open={modalOpen}
        title={editTarget ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
        onClose={() => setModalOpen(false)}
        size="md"
        footer={
          <div className="flex gap-2 justify-end">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : 'Simpan'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Nama Lengkap *</label>
            <input 
              value={fNama} 
              onChange={e => setFNama(e.target.value)} 
              placeholder="Nama lengkap siswa (Hanya Huruf)" 
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
            <label className="label">Email Siswa</label>
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
              <Select
                value={fTingkat}
                onChange={setFTingkat}
                placeholder="Tingkat"
                className="w-32"
                options={TINGKAT_OPTIONS}
              />
              <Select
                value={fJurusan}
                onChange={setFJurusan}
                placeholder="Pilih Kejuruan..."
                className="flex-1"
                options={JURUSAN_OPTIONS}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Ekstrakurikuler</label>
            <Select
              value={fEkskul}
              onChange={v => setFEkskul(v as 'programming' | 'english')}
              disabled={!canUseEkskulDropdown}
              options={[
                { value: 'programming', label: 'Programming' },
                { value: 'english', label: 'English Club' },
              ]}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!profileTarget}
        title="Profil Siswa"
        onClose={() => setProfileTarget(null)}
        size="md"
      >
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
              <p className="text-xs text-slate-400">{profileTarget?.kelas || '-'} · {profileTarget?.ekskul}</p>
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

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Siswa?"
        message={`Data "${deleteTarget?.nama}" dan semua riwayat absensinya akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkDeleteConfirmOpen}
        title="Hapus Siswa Terpilih?"
        message={`Sebanyak ${selectedIds.length} data siswa dan semua riwayat absensinya akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`}
        loading={bulkDeleting}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteConfirmOpen(false)}
      />

      {/* Modal Beri XP */}
      <Modal
        open={!!xpModalTarget}
        title="Beri Poin Keaktifan (XP)"
        onClose={() => setXpModalTarget(null)}
        size="sm"
        footer={
          <div className="flex gap-2 justify-end">
            <button onClick={() => setXpModalTarget(null)} className="btn-secondary">Batal</button>
            <button onClick={handleAwardXp} disabled={xpSaving} className="btn-primary">
              {xpSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Mengirim...</> : 'Beri XP'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">{xpModalTarget?.nama}</h4>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">{xpModalTarget?.kelas} • {xpModalTarget?.ekskul}</p>
              </div>
              <LevelBadge exp={xpModalTarget?.xp || 0} size="sm" />
            </div>
            <ExpProgressBar exp={xpModalTarget?.xp || 0} />
          </div>

          <div className="form-group">
            <label className="label">Kategori Kegiatan</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFXpActivity('tugas')
                  setFXpAmount(20)
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                  fXpActivity === 'tugas'
                    ? 'border-[#1E90FF] bg-[#1E90FF]/20 text-[#001F3F]'
                    : 'border-white/10 bg-deep-navy text-slate-400 hover:bg-white/5'
                }`}
              >
                <span>📝</span>
                Tugas
              </button>
              <button
                type="button"
                onClick={() => {
                  setFXpActivity('proyek')
                  setFXpAmount(50)
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                  fXpActivity === 'proyek'
                    ? 'border-[#1E90FF] bg-[#1E90FF]/20 text-[#001F3F]'
                    : 'border-white/10 bg-deep-navy text-slate-400 hover:bg-white/5'
                }`}
              >
                <span>💻</span>
                Proyek
              </button>
              <button
                type="button"
                onClick={() => {
                  setFXpActivity('manual')
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                  fXpActivity === 'manual'
                    ? 'border-[#1E90FF] bg-[#1E90FF]/20 text-[#001F3F]'
                    : 'border-white/10 bg-deep-navy text-slate-400 hover:bg-white/5'
                }`}
              >
                <span>⚡</span>
                Manual
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="label">Jumlah Poin XP</label>
            {fXpActivity !== 'manual' ? (
              <div className="p-3 bg-[#1E90FF]/10 border border-[#1E90FF]/30 rounded-xl flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Preset Poin Terpilih:</span>
                <span className="text-base font-mono font-black text-white">+{fXpAmount} XP</span>
              </div>
            ) : (
              <input
                type="number"
                min="1"
                max="1000"
                value={fXpAmount}
                onChange={e => setFXpAmount(parseInt(e.target.value) || 0)}
                className="input font-mono"
                placeholder="Misal: 15"
              />
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
