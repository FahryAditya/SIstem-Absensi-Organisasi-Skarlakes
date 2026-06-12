'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import Table from '@/components/ui/Table'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatDate } from '@/lib/utils'
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

interface Member {
  id: number; nis: string | null; name: string; class: string | null; email: string | null; created_at: string; exp: number; level: number; jabatan: string | null
}

interface Props {
  user: { id: number; nama: string; email: string; role: string; activeOrgId?: number }
}

const PAGE_SIZE = 15

export default function SiswaClient({ user }: Props) {
  const [data, setData] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Member | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // XP awarding states
  const [xpModalTarget, setXpModalTarget] = useState<Member | null>(null)
  const [fXpAmount, setFXpAmount] = useState<number>(20)
  const [fXpActivity, setFXpActivity] = useState<'tugas' | 'proyek' | 'manual'>('tugas')
  const [xpSaving, setXpSaving] = useState(false)

  // Form state
  const [fNama, setFNama] = useState('')
  const [fNis, setFNis] = useState('')
  const [fTingkat, setFTingkat] = useState('')
  const [fJurusan, setFJurusan] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fJabatan, setFJabatan] = useState('Anggota')

  const load = useCallback(async () => {
    if (!user.activeOrgId && user.role !== 'SUPER_ADMIN') return
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      ...(debouncedSearch && { search: debouncedSearch }),
    })
    
    try {
      const json = await fetchJsonCachedUrl<{ data?: Member[]; total?: number; totalPages?: number }>(`/api/siswa?${params}`)
      setData(json.data || [])
      setTotal(json.total || 0)
      setTotalPages(json.totalPages || 1)
    } catch (e: any) {
      toast.error('Gagal memuat data anggota')
    }
    setLoading(false)
  }, [page, debouncedSearch, user.activeOrgId, user.role])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [debouncedSearch])

  const openAdd = useCallback(() => {
    setEditTarget(null)
    setFNama(''); setFNis(''); setFTingkat(''); setFJurusan(''); setFEmail(''); setFJabatan('Anggota')
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((m: Member) => {
    setEditTarget(m)
    setFNama(m.name); setFNis(m.nis || '')
    const kls = m.class || ''
    const parts = kls.split(' ')
    const t = ['X', 'XI', 'XII'].includes(parts[0]) ? parts[0] : ''
    setFTingkat(t)
    setFJurusan(t ? parts.slice(1).join(' ') : kls)
    setFEmail(m.email || '')
    setFJabatan(m.jabatan || 'Anggota')
    setModalOpen(true)
  }, [])

  const handleSave = useCallback(async () => {
    if (!fNama.trim()) { toast.error('Nama wajib diisi'); return }
    setSaving(true)
    const finalKelas = `${fTingkat} ${fJurusan}`.trim()
    const body = {
      name: fNama.trim(),
      nis: fNis.trim() || undefined,
      class: finalKelas || undefined,
      email: fEmail.trim() || undefined,
      jabatan: fJabatan.trim() || 'Anggota',
    }
    const res = await fetch('/api/siswa', {
      method: editTarget ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editTarget ? { id: editTarget.id, ...body } : body),
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Gagal menyimpan'); setSaving(false); return }
    toast.success(editTarget ? 'Data anggota diperbarui' : 'Anggota berhasil ditambahkan')
    clearJsonCache()
    setSaving(false); setModalOpen(false); load()
  }, [fNama, fNis, fTingkat, fJurusan, fEmail, fJabatan, editTarget, load])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/siswa?id=${deleteTarget.id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Gagal menghapus'); setDeleting(false); return }
    toast.success('Anggota dihapus')
    clearJsonCache()
    setDeleting(false); setDeleteTarget(null); load()
  }, [deleteTarget, load])

  const handleAwardXp = useCallback(async () => {
    if (!xpModalTarget) return
    setXpSaving(true)
    try {
      const res = await fetch('/api/admin/exp', { // Assuming unified EXP API
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: xpModalTarget.id,
          amount: fXpAmount,
          reason: fXpActivity === 'manual' ? 'Pemberian manual' : `Kegiatan ${fXpActivity}`
        })
      })
      if (!res.ok) throw new Error('Gagal memberikan XP')
      toast.success(`Berhasil memberikan +${fXpAmount} XP ke ${xpModalTarget.name}`)
      setXpModalTarget(null)
      clearJsonCache()
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
    setXpSaving(false)
  }, [xpModalTarget, fXpAmount, fXpActivity, load])

  const columns = useMemo(() => [
    { key: 'no', label: 'No', render: (m: Member) => {
      const idx = data.indexOf(m)
      return <span className="text-slate-400 font-mono text-xs">{(page - 1) * PAGE_SIZE + idx + 1}</span>
    }},
    { key: 'nis', label: 'NIS', render: (m: Member) => <span className="font-mono text-xs text-slate-400">{m.nis || '-'}</span> },
    { key: 'name', label: 'Nama Anggota', render: (m: Member) => (
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-persian-blue/10 text-blue-300 border border-persian-blue/20 flex items-center justify-center text-xs font-bold">
          {m.name.charAt(0).toUpperCase()}
        </span>
        <span>
          <span className="block font-semibold text-white">{m.name}</span>
          {m.email && <span className="block text-[10px] text-slate-400">{m.email}</span>}
        </span>
      </div>
    ) },
    { key: 'class', label: 'Kelas', render: (m: Member) => <span className="text-slate-400 text-xs">{m.class || '-'}</span> },
    { key: 'jabatan', label: 'Jabatan', render: (m: Member) => <span className="badge bg-white/5 text-white border-white/10">{m.jabatan || 'Anggota'}</span> },
    { key: 'xp', label: 'Level & Progress', render: (m: Member) => (
      <div className="flex flex-col gap-1.5 max-w-[170px] min-w-[140px]">
        <div className="flex justify-between items-center">
          <LevelBadge exp={m.exp || 0} size="sm" />
          <span className="font-mono text-[10px] font-bold text-blue-300">{m.exp || 0} XP</span>
        </div>
        <ExpProgressBar exp={m.exp || 0} showLabels={false} />
      </div>
    )},
    {
      key: 'actions', label: '',
      render: (m: Member) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setXpModalTarget(m)} className="btn-icon text-amber-500 hover:bg-amber-500/10" title="Beri Poin XP"><Zap className="w-3.5 h-3.5" /></button>
          <button onClick={() => openEdit(m)} className="btn-icon text-persian-blue hover:bg-persian-blue/10"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleteTarget(m)} className="btn-icon text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      )
    },
  ], [data, page, openEdit])

  if (!mounted) return null;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-persian-blue" />
            <h2 className="page-title">Data Anggota</h2>
            <span className="badge bg-persian-blue/10 text-blue-300 border border-persian-blue/20">{total} anggota</span>
          </div>
          <p className="page-sub mt-0.5">Kelola daftar anggota organisasi aktif</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button onClick={openAdd} disabled={!user.activeOrgId} className="btn-primary">
            <Plus className="w-4 h-4" /> Tambah Anggota
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama atau NIS anggota..." className="input pl-10" />
        </div>
      </div>

      {!user.activeOrgId ? (
        <div className="card p-16 text-center">
          <p className="text-slate-400">Silakan pilih organisasi terlebih dahulu</p>
        </div>
      ) : (
        <Table
          columns={columns as any}
          data={data}
          loading={loading}
          emptyMessage="Belum ada anggota terdaftar"
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
          rowKey={m => (m as Member).id}
        />
      )}

      <Modal
        open={modalOpen}
        title={editTarget ? 'Edit Data Anggota' : 'Tambah Anggota Baru'}
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
            <input value={fNama} onChange={e => setFNama(e.target.value)} className="input" autoFocus />
          </div>
          <div className="form-group">
            <label className="label">NIS</label>
            <input value={fNis} onChange={e => setFNis(e.target.value)} className="input" />
          </div>
          <div className="form-group">
            <label className="label">Email</label>
            <input type="email" value={fEmail} onChange={e => setFEmail(e.target.value)} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="label">Tingkat</label>
              <Select value={fTingkat} onChange={setFTingkat} options={TINGKAT_OPTIONS} />
            </div>
            <div className="form-group">
              <label className="label">Jabatan</label>
              <input value={fJabatan} onChange={e => setFJabatan(e.target.value)} className="input" />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Jurusan/Kelas</label>
            <Select value={fJurusan} onChange={setFJurusan} options={JURUSAN_OPTIONS} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Anggota?"
        message={`Data "${deleteTarget?.name}" akan dihapus permanen.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Modal
        open={!!xpModalTarget}
        title="Beri XP"
        onClose={() => setXpModalTarget(null)}
        size="sm"
        footer={
          <div className="flex gap-2 justify-end">
            <button onClick={() => setXpModalTarget(null)} className="btn-secondary">Batal</button>
            <button onClick={handleAwardXp} disabled={xpSaving} className="btn-primary">Beri XP</button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Jumlah XP</label>
            <input type="number" value={fXpAmount} onChange={e => setFXpAmount(parseInt(e.target.value))} className="input" />
          </div>
          <div className="form-group">
            <label className="label">Kategori</label>
            <Select value={fXpActivity} onChange={v => setFXpActivity(v as any)} options={[
              { value: 'tugas', label: 'Tugas' },
              { value: 'proyek', label: 'Proyek' },
              { value: 'manual', label: 'Manual' },
            ]} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
