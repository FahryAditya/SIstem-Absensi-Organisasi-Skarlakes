'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import Table from '@/components/ui/Table'
import Modal from '@/components/ui/Modal'
import { Plus, Pencil, Trash2, Loader2, Search, Filter, Download, Upload, User, Mail, Hash, BookOpen } from 'lucide-react'
import { clearJsonCache, fetchJsonCachedUrl } from '@/lib/client-cache'
import * as XLSX from 'xlsx'

interface MemberData {
  id: number
  nis: string | null
  name: string
  email: string | null
  class: string | null
  level: number
  exp: number
  progress: number
}

interface Props {
  slug: string
}

export default function MembersClient({ slug }: Props) {
  const [members, setMembers] = useState<MemberData[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  // Form state
  const [fName, setFName] = useState('')
  const [fNis, setFNis] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fClass, setFClass] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const json = await fetchJsonCachedUrl<{ data?: MemberData[] }>(`/api/organizations/${slug}/members`)
    setMembers(json.data || [])
    setLoading(false)
  }, [slug])

  useEffect(() => { load() }, [load])

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    (m.nis || '').includes(search)
  )

  function openAdd() {
    setFName(''); setFNis(''); setFEmail(''); setFClass('')
    setModalOpen(true)
  }

  async function handleSave() {
    if (!fName.trim()) { toast.error('Nama wajib diisi'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/organizations/${slug}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fName.trim(), nis: fNis.trim(), email: fEmail.trim(), class: fClass.trim() })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan')
      toast.success('Anggota berhasil ditambahkan')
      clearJsonCache()
      setModalOpen(false)
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  function exportExcel() {
    const ws = XLSX.utils.json_to_sheet(members)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Members')
    XLSX.writeFile(wb, `Members_${slug}.xlsx`)
  }

  const columns = [
    { key: 'name', label: 'Nama', render: (m: MemberData) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-persian-blue/10 flex items-center justify-center text-persian-blue font-bold text-xs">
          {m.name.charAt(0).toUpperCase()}
        </div>
        <div className="font-bold text-white text-sm">{m.name}</div>
      </div>
    )},
    { key: 'nis', label: 'NIS', render: (m: MemberData) => <span className="text-xs text-slate-400 font-mono">{m.nis || '-'}</span> },
    { key: 'class', label: 'Kelas', render: (m: MemberData) => <span className="text-xs text-slate-300 font-bold">{m.class || '-'}</span> },
    { key: 'level', label: 'Level', render: (m: MemberData) => (
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase">Lvl {m.level}</span>
        <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500" style={{ width: `${m.progress}%` }} />
        </div>
      </div>
    )},
    { key: 'actions', label: '', render: (m: MemberData) => (
      <div className="flex gap-1">
        <button className="btn-icon text-blue-400 hover:bg-blue-500/10"><Pencil className="w-3.5 h-3.5" /></button>
        <button className="btn-icon text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )}
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari NIS atau Nama..." 
            className="input pl-10 h-10" 
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportExcel} className="btn-secondary h-10">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={openAdd} className="btn-primary h-10">
            <Plus className="w-4 h-4" /> Tambah Anggota
          </button>
        </div>
      </div>

      <Table 
        columns={columns} 
        data={filteredMembers} 
        loading={loading} 
        emptyMessage="Belum ada anggota di unit ini" 
        rowKey={(m: MemberData) => m.id} 
      />

      <Modal open={modalOpen} title="Tambah Anggota Baru" onClose={() => setModalOpen(false)} size="sm"
        footer={
          <div className="flex gap-2 justify-end">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Simpan'}
            </button>
          </div>
        }>
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Nama Lengkap *</label>
            <div className="relative"><User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
              <input value={fName} onChange={e => setFName(e.target.value)} placeholder="Misal: Ahmad Dani" className="input pl-10" autoFocus /></div>
          </div>
          <div className="form-group">
            <label className="label">NIS (Opsional)</label>
            <div className="relative"><Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
              <input value={fNis} onChange={e => setFNis(e.target.value)} placeholder="Nomor Induk Siswa" className="input pl-10" /></div>
          </div>
          <div className="form-group">
            <label className="label">Kelas (Opsional)</label>
            <div className="relative"><BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
              <input value={fClass} onChange={e => setFClass(e.target.value)} placeholder="Misal: X RPL 1" className="input pl-10" /></div>
          </div>
          <div className="form-group">
            <label className="label">Email (Opsional)</label>
            <div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
              <input value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="email@sekolah.sch.id" className="input pl-10" /></div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
