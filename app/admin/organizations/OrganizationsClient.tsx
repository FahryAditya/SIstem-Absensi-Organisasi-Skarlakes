'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Table from '@/components/ui/Table'
import Modal from '@/components/ui/Modal'
import { Plus, Pencil, Trash2, Loader2, Building2, School, CheckCircle2, XCircle } from 'lucide-react'
import Select from '@/components/ui/Select'
import { clearJsonCache, fetchJsonCachedUrl } from '@/lib/client-cache'
import { formatDateTime } from '@/lib/utils'

interface OrgData {
  id: number
  nama: string
  slug: string
  category: string
  school_origin: string
  status: string
  created_at: string
  admins?: {
    user: {
      nama: string
    }
  }[]
  _count?: {
    members: number
  }
}

interface Props {
  user: { id: number; nama: string; email: string; role: string }
}

export default function OrganizationsClient({ user }: Props) {
  const router = useRouter()
  const [orgs, setOrgs] = useState<OrgData[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [fNama, setFNama] = useState('')
  const [fCategory, setFCategory] = useState('Ekstrakurikuler')
  const [fSchool, setFSchool] = useState('SMK Airlangga')
  const [fStatus, setFStatus] = useState('Aktif')

  const load = useCallback(async () => {
    setLoading(true)
    const json = await fetchJsonCachedUrl<{ data?: OrgData[] }>('/api/organizations')
    setOrgs(json.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setFNama('')
    setFCategory('Ekstrakurikuler')
    setFSchool('SMK Airlangga')
    setFStatus('Aktif')
    setModalOpen(true)
  }

  async function handleSave() {
    if (!fNama.trim()) {
      toast.error('Nama organisasi wajib diisi')
      return
    }
    setSaving(true)

    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: fNama.trim(),
          category: fCategory,
          school_origin: fSchool,
          status: fStatus
        })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan')
      
      toast.success('Organisasi berhasil dibuat')
      clearJsonCache()
      setModalOpen(false)
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      key: 'nama',
      label: 'Nama Organisasi / Eskul',
      render: (o: OrgData) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${o.category === 'Organisasi' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-persian-blue/10 text-persian-blue'}`}>
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">{o.nama}</div>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{o.slug}</div>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Kategori',
      render: (o: OrgData) => (
        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${o.category === 'Organisasi' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-persian-blue/10 text-blue-400'}`}>
          {o.category}
        </span>
      )
    },
    {
      key: 'members',
      label: 'Anggota',
      render: (o: OrgData) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white">{o._count?.members || 0}</span>
          <span className="text-[10px] text-slate-400">Terdaftar</span>
        </div>
      )
    },
    {
      key: 'school_origin',
      label: 'Asal Sekolah',
      render: (o: OrgData) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <School className="w-3 h-3 text-slate-400" />
          {o.school_origin}
        </div>
      )
    },
    {
      key: 'admins',
      label: 'Administrator Unit',
      render: (o: OrgData) => (
        <div className="flex flex-col gap-0.5">
          {o.admins && o.admins.length > 0 ? (
            o.admins.map((a, idx) => (
              <span key={idx} className="text-xs font-bold text-persian-blue truncate max-w-[120px]">
                {a.user.nama}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500 italic">Belum ada</span>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (o: OrgData) => (
        <div className="flex items-center gap-1.5">
          {o.status === 'Aktif' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs font-bold text-green-500">Aktif</span>
            </>
          ) : (
            <>
              <XCircle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs font-bold text-red-500">Nonaktif</span>
            </>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (o: OrgData) => (
        <div className="flex gap-2">
          <button 
            onClick={() => router.push(`/admin/organizations/${o.slug}`)}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white transition-all"
          >
            Buka Workspace
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-persian-blue" />
              <h2 className="page-title">Organisasi & Ekstrakurikuler</h2>
            </div>
            <p className="page-sub mt-0.5">Kelola seluruh unit organisasi dan ekstrakurikuler sekolah</p>
          </div>
          <button onClick={openAdd} className="btn-primary">
            <Plus className="w-4 h-4" />
            Tambah Organisasi / Eskul
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-persian-blue">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Unit</div>
          <div className="text-2xl font-black text-white font-mono">{orgs.length}</div>
        </div>
        <div className="card p-4 border-l-4 border-indigo-500">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Organisasi</div>
          <div className="text-2xl font-black text-white font-mono">{orgs.filter(o => o.category === 'Organisasi').length}</div>
        </div>
        <div className="card p-4 border-l-4 border-blue-400">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ekstrakurikuler</div>
          <div className="text-2xl font-black text-white font-mono">{orgs.filter(o => o.category === 'Ekstrakurikuler').length}</div>
        </div>
        <div className="card p-4 border-l-4 border-green-500">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit Aktif</div>
          <div className="text-2xl font-black text-white font-mono">{orgs.filter(o => o.status === 'Aktif').length}</div>
        </div>
      </div>

      <Table 
        columns={columns} 
        data={orgs} 
        loading={loading} 
        emptyMessage="Belum ada organisasi yang dibuat" 
        rowKey={(o: OrgData) => o.id} 
      />

      <Modal 
        open={modalOpen} 
        title="Tambah Organisasi / Eskul Baru" 
        onClose={() => setModalOpen(false)} 
        size="sm"
        footer={
          <div className="flex gap-2 justify-end">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin"/>Menyimpan...</> : 'Simpan'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Kategori *</label>
            <Select
              value={fCategory}
              onChange={setFCategory}
              options={[
                { value: 'Organisasi', label: 'Organisasi' },
                { value: 'Ekstrakurikuler', label: 'Ekstrakurikuler' }
              ]}
            />
          </div>
          <div className="form-group">
            <label className="label">Nama Organisasi / Eskul *</label>
            <input 
              value={fNama} 
              onChange={e => setFNama(e.target.value)} 
              placeholder="Misal: Programming Club" 
              className="input" 
              autoFocus 
            />
          </div>
          <div className="form-group">
            <label className="label">Asal Sekolah *</label>
            <Select
              value={fSchool}
              onChange={setFSchool}
              options={[
                { value: 'SMK Airlangga', label: 'SMK Airlangga' },
                { value: 'SMK Kesehatan Airlangga', label: 'SMK Kesehatan Airlangga' },
                { value: 'Gabungan Dua Sekolah', label: 'Gabungan Dua Sekolah' }
              ]}
            />
          </div>
          <div className="form-group">
            <label className="label">Status *</label>
            <Select
              value={fStatus}
              onChange={setFStatus}
              options={[
                { value: 'Aktif', label: 'Aktif' },
                { value: 'Tidak Aktif', label: 'Tidak Aktif' }
              ]}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
