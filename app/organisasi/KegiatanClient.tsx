'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import Select from '@/components/ui/Select'
import Table, { Column } from '@/components/ui/Table'
import Modal from '@/components/ui/Modal'
import { Plus, Trash2, Loader2, Calendar, Users, LayoutGrid, Download } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

type TipeKegiatan = 'panitia' | 'piket' | 'petugas' | 'rapat'
type Organisasi = 'OSIS' | 'MPK'

interface Kegiatan {
  id: number
  nama_kegiatan: string
  tipe: TipeKegiatan
  tanggal: string | null
  _count: { pengelompokan: number }
}

interface Siswa {
  id: number
  nama: string
  kelas: string
}

interface Pengelompokan {
  id: number
  kegiatan_id: number
  siswa_id: number
  organisasi: Organisasi
  sub_kategori: string | null
  siswa: Siswa
}

const PRESET_NAMES = [
  'Kegiatan Sekolah Default',
  'Rapat',
  'Jumat Seni',
  'Jumat Religius',
  'Jumat Pramuka',
  'Petugas Upacara',
  'Panitia (Bisa Costume)',
  'Piket Kebersihan & Penyambutan',
]

export default function KegiatanClient({ user }: { user: any }) {
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>([])
  const [activeKegiatanId, setActiveKegiatanId] = useState<number | null>(null)
  const [pengelompokan, setPengelompokan] = useState<Pengelompokan[]>([])
  const [allSiswa, setAllSiswa] = useState<Siswa[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingGroup, setLoadingGroup] = useState(false)
  
  const [createModal, setCreateModal] = useState(false)
  const [addSiswaModal, setAddSiswaModal] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Create Kegiatan Form
  const [fNama, setFNama] = useState('')
  const [isCustomNama, setIsCustomNama] = useState(false)
  const [fTipe, setFTipe] = useState<TipeKegiatan>('panitia')
  const [fTanggal, setFTanggal] = useState('')
  
  // Add Siswa Form
  const [fSiswaId, setFSiswaId] = useState<number | null>(null)
  const [fOrg, setFOrg] = useState<Organisasi>('OSIS')
  const [fSub, setFSub] = useState('')

  const loadKegiatan = useCallback(async () => {
    try {
      const res = await fetch('/api/kegiatan')
      const json = await res.json()
      setKegiatan(json.data || [])
    } catch (e) {
      toast.error('Gagal memuat daftar kegiatan')
    }
  }, [])

  const loadPengelompokan = useCallback(async (id: number) => {
    setLoadingGroup(true)
    try {
      const res = await fetch(`/api/kegiatan/${id}/pengelompokan`)
      const json = await res.json()
      setPengelompokan(json.data || [])
    } catch (e) {
      toast.error('Gagal memuat data pengelompokan')
    } finally {
      setLoadingGroup(false)
    }
  }, [])

  const loadSiswa = useCallback(async () => {
    try {
      const res = await fetch('/api/siswa?limit=1000')
      const json = await res.json()
      setAllSiswa(json.data || [])
    } catch (e) {
      console.error('Gagal memuat data siswa')
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadKegiatan(), loadSiswa()]).finally(() => setLoading(false))
  }, [loadKegiatan, loadSiswa])

  useEffect(() => {
    if (activeKegiatanId) {
      loadPengelompokan(activeKegiatanId)
    } else {
      setPengelompokan([])
    }
  }, [activeKegiatanId, loadPengelompokan])

  async function handleCreateKegiatan() {
    if (!fNama.trim()) return toast.error('Nama kegiatan wajib diisi')
    setSaving(true)
    try {
      const res = await fetch('/api/kegiatan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama_kegiatan: fNama, tipe: fTipe, tanggal: fTanggal || null })
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Gagal membuat kegiatan')
      toast.success('Kegiatan berhasil dibuat')
      setCreateModal(false)
      setFNama('')
      loadKegiatan()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleAddSiswa() {
    if (!activeKegiatanId || !fSiswaId) return toast.error('Lengkapi data')
    setSaving(true)
    try {
      const res = await fetch(`/api/kegiatan/${activeKegiatanId}/pengelompokan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siswa_id: fSiswaId, organisasi: fOrg, sub_kategori: fSub || null })
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Gagal menambahkan siswa')
      toast.success('Siswa berhasil ditambahkan')
      setAddSiswaModal(false)
      setFSiswaId(null)
      setFSub('')
      loadPengelompokan(activeKegiatanId)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteGrouping(id: number) {
    if (!confirm('Hapus siswa dari pengelompokan?')) return
    try {
      const res = await fetch(`/api/kegiatan/0/pengelompokan?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus')
      toast.success('Dihapus')
      if (activeKegiatanId) loadPengelompokan(activeKegiatanId)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  function handleExport() {
    if (!activeKegiatanId) return
    window.open(`/api/export?tipe=kegiatan&kegiatanId=${activeKegiatanId}`, '_blank')
  }

  const activeKegiatan = kegiatan.find(k => k.id === activeKegiatanId)

  const columns: Column<Pengelompokan>[] = [
    { key: 'no', label: 'No', render: (_, index) => <span className="text-slate-400 font-mono">#{index + 1}</span> },
    { key: 'nama', label: 'Nama', render: (p) => <span className="font-bold text-white">{p.siswa.nama}</span> },
    { key: 'kelas', label: 'Kelas', render: (p) => <span className="text-slate-400">{p.siswa.kelas}</span> },
    { key: 'organisasi', label: 'Organisasi', render: (p) => (
      <span className={`font-bold ${p.organisasi === 'OSIS' ? 'text-[#3D3DB8]' : 'text-[#DC143C]'}`}>
        ● {p.organisasi}
      </span>
    )},
    { key: 'aksi', label: '', render: (p) => (
      <button onClick={() => handleDeleteGrouping(p.id)} className="btn-icon text-red-500 hover:bg-red-500/10">
        <Trash2 className="w-4 h-4" />
      </button>
    )},
  ]

  // Filter for Piket sub-categories
  const penyambutan = pengelompokan.filter(p => p.sub_kategori === 'Penyambutan')
  const kebersihan = pengelompokan.filter(p => p.sub_kategori === 'Kebersihan')
  const nonPiket = pengelompokan // for others

  if (loading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <LayoutGrid className="w-5 h-5 text-persian-blue" />
            <h2 className="page-title">Pengelompokan Kegiatan OSIS</h2>
          </div>
          <p className="page-sub">Kelola pembagian tugas siswa untuk berbagai kegiatan sekolah.</p>
        </div>
        <button onClick={() => setCreateModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Buat Kegiatan
        </button>
      </div>

      <div className="card p-5">
        <div className="form-group max-w-md">
          <label className="label">Pilih Kegiatan</label>
          <Select
            value={activeKegiatanId?.toString() || ''}
            onChange={(val) => setActiveKegiatanId(parseInt(val))}
            options={[
              { value: '', label: '-- Pilih Kegiatan --' },
              ...kegiatan.map(k => ({ value: k.id.toString(), label: k.nama_kegiatan }))
            ]}
          />
        </div>
      </div>

      {activeKegiatan && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-white uppercase">{activeKegiatan.nama_kegiatan}</h3>
              <div className="flex gap-3 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {activeKegiatan.tanggal ? formatDateTime(activeKegiatan.tanggal) : 'Tanpa Tanggal'}</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {pengelompokan.length} Siswa</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExport} className="btn-secondary">
                <Download className="w-4 h-4" /> Export Excel
              </button>
              <button onClick={() => setAddSiswaModal(true)} className="btn-secondary">
                <Plus className="w-4 h-4" /> Tambah Siswa
              </button>
            </div>
          </div>

          {activeKegiatan.tipe === 'piket' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="bg-persian-blue/10 border border-persian-blue/20 p-3 rounded-xl text-center font-bold text-persian-blue uppercase tracking-widest text-sm">
                  Penyambutan
                </div>
                <Table columns={columns} data={penyambutan} loading={loadingGroup} />
              </div>
              <div className="space-y-3">
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-center font-bold text-amber-500 uppercase tracking-widest text-sm">
                  Kebersihan
                </div>
                <Table columns={columns} data={kebersihan} loading={loadingGroup} />
              </div>
            </div>
          ) : (
            <div className="card overflow-hidden">
               <Table columns={columns} data={pengelompokan} loading={loadingGroup} />
            </div>
          )}
        </div>
      )}

      {/* Modal Create Kegiatan */}
      <Modal open={createModal} title="Buat Kegiatan Baru" onClose={() => setCreateModal(false)}
        footer={<div className="flex justify-end gap-2"><button onClick={() => setCreateModal(false)} className="btn-secondary">Batal</button><button onClick={handleCreateKegiatan} disabled={saving} className="btn-primary">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Simpan</button></div>}>
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Judul / Acara Kegiatan</label>
            <Select 
              value={isCustomNama ? 'CUSTOM' : fNama} 
              onChange={(val) => {
                if (val === 'CUSTOM') {
                  setIsCustomNama(true)
                  setFNama('')
                } else {
                  setIsCustomNama(false)
                  setFNama(val)
                }
              }} 
              options={[
                { value: '', label: '-- Pilih Judul Kegiatan --' },
                ...PRESET_NAMES.map(name => ({ value: name, label: name })),
                { value: 'CUSTOM', label: 'Lainnya / Nama Custom...' }
              ]} 
            />
          </div>
          {isCustomNama && (
            <div className="form-group slide-up">
              <label className="label">Masukkan Nama Custom</label>
              <input 
                value={fNama} 
                onChange={e => setFNama(e.target.value)} 
                placeholder="Tulis nama kegiatan di sini..." 
                className="input" 
                autoFocus
              />
            </div>
          )}
          <div className="form-group">
            <label className="label">Jenis Kegiatan</label>
            <Select value={fTipe} onChange={val => setFTipe(val as any)} options={[
              { value: 'panitia', label: 'Panitia (Bisa Costume)' },
              { value: 'piket', label: 'Piket Kebersihan & Penyambutan' },
              { value: 'petugas', label: 'Petugas Upacara' },
              { value: 'rapat', label: 'Rapat / Lainnya' }
            ]} />
          </div>
          <div className="form-group"><label className="label">Tanggal (Opsional)</label><input type="date" value={fTanggal} onChange={e => setFTanggal(e.target.value)} className="input" /></div>
        </div>
      </Modal>

      {/* Modal Add Siswa */}
      <Modal open={addSiswaModal} title="Tambahkan Siswa ke Kegiatan" onClose={() => setAddSiswaModal(false)}
        footer={<div className="flex justify-end gap-2"><button onClick={() => setAddSiswaModal(false)} className="btn-secondary">Batal</button><button onClick={handleAddSiswa} disabled={saving} className="btn-primary">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Tambahkan</button></div>}>
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Pilih Siswa</label>
            <Select value={fSiswaId?.toString() || ''} onChange={val => setFSiswaId(parseInt(val))} options={[
              { value: '', label: '-- Pilih Siswa --' },
              ...allSiswa.map(s => ({ value: s.id.toString(), label: `${s.nama} (${s.kelas})` }))
            ]} />
          </div>
          <div className="form-group">
            <label className="label">Organisasi</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setFOrg('OSIS')} className={`py-2 rounded-xl border font-bold transition-all ${fOrg === 'OSIS' ? 'bg-[#3D3DB8] text-white border-transparent' : 'bg-deep-navy text-slate-400 border-white/10'}`}>OSIS</button>
              <button onClick={() => setFOrg('MPK')} className={`py-2 rounded-xl border font-bold transition-all ${fOrg === 'MPK' ? 'bg-[#DC143C] text-white border-transparent' : 'bg-deep-navy text-slate-400 border-white/10'}`}>MPK</button>
            </div>
          </div>
          {activeKegiatan?.tipe === 'piket' && (
            <div className="form-group">
              <label className="label">Sub Kategori Piket</label>
              <Select value={fSub} onChange={setFSub} options={[
                { value: 'Penyambutan', label: 'Penyambutan' },
                { value: 'Kebersihan', label: 'Kebersihan' }
              ]} />
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
