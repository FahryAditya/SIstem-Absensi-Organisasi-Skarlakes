'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import Table from '@/components/ui/Table'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Select from '@/components/ui/Select'
import { OrgBadge } from '@/components/ui/Badges'
import { clearJsonCache } from '@/lib/client-cache'
import { LevelBadge } from '@/components/ui/LevelBadge'
import { ExpProgressBar } from '@/components/ui/ExpProgressBar'
import {
  Trophy,
  Plus,
  Search,
  Pencil,
  Trash2,
  Award,
  Loader2,
  Star,
  Zap,
  Crown,
  Heart,
  Flame,
  Code,
  Globe,
  Compass,
  CheckCircle,
  Users,
  Target
} from 'lucide-react'

interface Pencapaian {
  id: number
  icon: string
  nama_pencapaian: string
  deskripsi: string
  exp_reward: number
  organisasi: 'programming' | 'english' | 'osis' | 'mpk'
  created_at: string
}

interface Member {
  id: number
  nama: string
  kelas: string | null
  nis: string | null
  xp: number
}

interface Props {
  user: { id: number; nama: string; email: string; role: string }
}

const ICON_OPTIONS = [
  { value: 'trophy', label: '🏆 Trophy' },
  { value: 'star', label: '⭐ Star' },
  { value: 'workspace_premium', label: '🥇 Medal' },
  { value: 'school', label: '🎓 Graduate' },
  { value: 'code', label: '💻 Code' },
  { value: 'translate', label: '🗣️ Speak' },
  { value: 'military_tech:military_tech', label: '🎖️ Star Badge' },
  { value: 'local_fire_department', label: '🔥 Fire' },
  { value: 'group', label: '👥 Teamwork' },
  { value: 'emoji_events', label: '🎗️ Ribbon' }
]

function getLucideIcon(iconName: string) {
  switch (iconName.toLowerCase()) {
    case 'trophy': return <Trophy className="w-5 h-5 text-amber-500 fill-amber-300/30" />
    case 'star': return <Star className="w-5 h-5 text-yellow-500 fill-yellow-300/30" />
    case 'workspace_premium': return <Award className="w-5 h-5 text-orange-500 fill-orange-300/30" />
    case 'school': return <Crown className="w-5 h-5 text-persian-blue/100 fill-blue-300/30" />
    case 'code': return <Code className="w-5 h-5 text-teal-500" />
    case 'translate': return <Globe className="w-5 h-5 text-blue-500" />
    case 'local_fire_department': return <Flame className="w-5 h-5 text-red-500 fill-red-300/30" />
    case 'group': return <Users className="w-5 h-5 text-persian-blue/100" />
    default: return <Compass className="w-5 h-5 text-slate-400" />
  }
}

export default function PencapaianClient({ user }: Props) {
  const [data, setData] = useState<Pencapaian[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [orgTab, setOrgTab] = useState<'all' | 'programming' | 'english' | 'osis' | 'mpk'>('all')

  // Templates CRUD Modal States
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Pencapaian | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Fields for CRUD form
  const [fNama, setFNama] = useState('')
  const [fDeskripsi, setFDeskripsi] = useState('')
  const [fIcon, setFIcon] = useState('trophy')
  const [fExpReward, setFExpReward] = useState(25)
  const [fOrganisasi, setFOrganisasi] = useState<'programming' | 'english' | 'osis' | 'mpk'>('programming')

  // Delete Template Modal
  const [deleteTarget, setDeleteTarget] = useState<Pencapaian | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Award Flow States
  const [awardModalOpen, setAwardModalOpen] = useState(false)
  const [awardTarget, setAwardTarget] = useState<Pencapaian | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [awarding, setAwarding] = useState(false)

  // Permissions helper
  const canManageOrg = useCallback((org: string) => {
    if (user.role === 'administrator') return true
    if (org === 'programming' && user.role === 'admin_programming') return true
    if (org === 'english' && user.role === 'admin_english') return true
    if ((org === 'osis' || org === 'mpk') && user.role === 'admin_osis_mpk') return true
    return false
  }, [user.role])

  const canCreate = useMemo(() => {
    return user.role === 'administrator' ||
      user.role === 'admin_programming' ||
      user.role === 'admin_english' ||
      user.role === 'admin_osis_mpk'
  }, [user.role])

  // Load Achievements
  const loadAchievements = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/pencapaian')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal memuat data')
      setData(json.data || [])
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAchievements()
  }, [loadAchievements])

  // Load Members dynamically when Award Modal opens
  const loadMembers = useCallback(async (org: string) => {
    setLoadingMembers(true)
    try {
      let url = ''
      if (org === 'programming' || org === 'english') {
        url = `/api/siswa?limit=200&ekskul=${org}`
      } else {
        url = `/api/organisasi?tipe=${org}&limit=200`
      }
      const res = await fetch(url)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal memuat anggota')
      
      const mapped = (json.data || []).map((m: any) => ({
        id: m.id,
        nama: m.nama,
        kelas: m.kelas || m.jabatan || '',
        nis: m.nis || '',
        xp: m.xp || 0
      }))
      setMembers(mapped)
    } catch (e: any) {
      toast.error('Gagal memuat anggota: ' + e.message)
    } finally {
      setLoadingMembers(false)
    }
  }, [])

  const handleOpenAward = useCallback((p: Pencapaian) => {
    setAwardTarget(p)
    setSelectedMemberId('')
    setMembers([])
    setAwardModalOpen(true)
    loadMembers(p.organisasi)
  }, [loadMembers])

  const handleAward = useCallback(async () => {
    if (!selectedMemberId || !awardTarget) return toast.error('Pilih anggota terlebih dahulu')
    setAwarding(true)
    try {
      const res = await fetch('/api/pencapaian/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pencapaianId: awardTarget.id,
          memberId: parseInt(selectedMemberId),
          tipe: (awardTarget.organisasi === 'programming' || awardTarget.organisasi === 'english') ? 'ekskul' : awardTarget.organisasi
        })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal memberikan pencapaian')
      
      toast.success(
        <div className="space-y-1">
          <p className="font-bold">🏆 Pencapaian Sukses Diberikan!</p>
          <p className="text-xs">{json.awardedTo} menerima +{awardTarget.exp_reward} EXP.</p>
          {json.levelUp && <p className="text-xs font-black text-amber-500 animate-bounce mt-0.5">🎉 LEVEL UP ke Level {json.newLevel}!</p>}
        </div>,
        { duration: 4000 }
      )
      
      setAwardModalOpen(false)
      clearJsonCache()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setAwarding(false)
    }
  }, [selectedMemberId, awardTarget])

  const openAdd = useCallback(() => {
    setEditTarget(null)
    setFNama('')
    setFDeskripsi('')
    setFIcon('trophy')
    setFExpReward(25)
    
    // Choose appropriate default organization based on admin role
    if (user.role === 'admin_programming') setFOrganisasi('programming')
    else if (user.role === 'admin_english') setFOrganisasi('english')
    else if (user.role === 'admin_osis_mpk') setFOrganisasi('osis')
    else setFOrganisasi('programming')

    setModalOpen(true)
  }, [user.role])

  const openEdit = useCallback((p: Pencapaian) => {
    setEditTarget(p)
    setFNama(p.nama_pencapaian)
    setFDeskripsi(p.deskripsi)
    setFIcon(p.icon)
    setFExpReward(p.exp_reward)
    setFOrganisasi(p.organisasi)
    setModalOpen(true)
  }, [])

  const handleSave = useCallback(async () => {
    if (!fNama.trim()) return toast.error('Nama pencapaian wajib diisi')
    if (!fDeskripsi.trim()) return toast.error('Deskripsi wajib diisi')
    if (fExpReward < 0) return toast.error('EXP reward minimal 0')

    setSaving(true)
    try {
      const payload = {
        icon: fIcon,
        nama_pencapaian: fNama,
        deskripsi: fDeskripsi,
        exp_reward: fExpReward,
        organisasi: fOrganisasi
      }

      let res
      if (editTarget) {
        res = await fetch('/api/pencapaian', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editTarget.id, ...payload })
        })
      } else {
        res = await fetch('/api/pencapaian', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan data')
      toast.success(editTarget ? 'Pencapaian diperbarui' : 'Pencapaian dibuat')
      setModalOpen(false)
      clearJsonCache()
      loadAchievements()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }, [editTarget, fNama, fDeskripsi, fIcon, fExpReward, fOrganisasi, loadAchievements])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/pencapaian?id=${deleteTarget.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus')
      toast.success('Pencapaian berhasil dihapus')
      setDeleteTarget(null)
      clearJsonCache()
      loadAchievements()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setDeleting(false)
    }
  }, [deleteTarget, loadAchievements])

  // Filter templates
  const filteredData = useMemo(() => {
    return data.filter(p => {
      const matchSearch = p.nama_pencapaian.toLowerCase().includes(search.toLowerCase()) || p.deskripsi.toLowerCase().includes(search.toLowerCase())
      const matchTab = orgTab === 'all' ? true : p.organisasi === orgTab
      return matchSearch && matchTab
    })
  }, [data, search, orgTab])

  // Active member for awarding preview
  const activeMember = useMemo(() => {
    return members.find(m => m.id.toString() === selectedMemberId) || null
  }, [members, selectedMemberId])

  const columns = useMemo(() => [
    { key: 'icon', label: 'Badge', render: (p: Pencapaian) => (
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10/50 flex items-center justify-center shadow-inner">
        {getLucideIcon(p.icon)}
      </div>
    )},
    { key: 'nama_pencapaian', label: 'Pencapaian / Achievement', render: (p: Pencapaian) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-extrabold text-white">{p.nama_pencapaian}</span>
        <span className="text-xs text-slate-400 font-semibold">{p.deskripsi}</span>
      </div>
    )},
    { key: 'organisasi', label: 'Organisasi', render: (p: Pencapaian) => <OrgBadge org={p.organisasi} /> },
    { key: 'exp_reward', label: 'EXP Reward', render: (p: Pencapaian) => (
      <span className="inline-flex items-center gap-1 font-extrabold font-mono text-xs text-[#2e7d32] bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-lg shadow-sm">
        <Zap className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400" /> +{p.exp_reward} EXP
      </span>
    )},
    {
      key: 'actions', label: '',
      render: (p: Pencapaian) => (
        <div className="flex items-center gap-2">
          {canManageOrg(p.organisasi) && (
            <button
              onClick={() => handleOpenAward(p)}
              className="btn-secondary py-1 px-3 text-xs bg-white/5 font-bold border-white/10 hover:bg-white/10 flex items-center gap-1 shrink-0"
            >
              <Trophy className="w-3.5 h-3.5 text-yellow-500" /> Award Member
            </button>
          )}
          {canManageOrg(p.organisasi) && (
            <>
              <button onClick={() => openEdit(p)} className="btn-icon text-persian-blue/100 hover:bg-persian-blue/10"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => setDeleteTarget(p)} className="btn-icon text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
            </>
          )}
        </div>
      )
    },
  ], [canManageOrg, openEdit, handleOpenAward])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-500 animate-pulse" />
            <h2 className="page-title">Pencapaian & Achievements</h2>
            <span className="badge bg-amber-500/10 text-amber-400 border border-amber-100">{data.length} Pencapaian</span>
          </div>
          <p className="page-sub mt-0.5">Kelola template pencapaian dan berikan penghargaan EXP kepada anggota organisasi</p>
        </div>
        {canCreate && (
          <button onClick={openAdd} className="btn-primary">
            <Plus className="w-4 h-4" /> Tambah Pencapaian
          </button>
        )}
      </div>

      {/* Tabs and Search Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama atau deskripsi pencapaian..."
            className="input pl-10"
          />
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-white/10 p-1 rounded-xl border border-white/10 w-full sm:w-auto overflow-x-auto shrink-0">
          {(['all', 'programming', 'english', 'osis', 'mpk'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setOrgTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all duration-300 shrink-0 ${
                orgTab === tab
                  ? 'bg-deep-navy text-[#001F3F] shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'all' ? 'Semua' : tab === 'osis' || tab === 'mpk' ? tab.toUpperCase() : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns as Parameters<typeof Table>[0]['columns']}
        data={filteredData}
        loading={loading}
        emptyMessage="Belum ada data pencapaian terdaftar"
        rowKey={p => (p as Pencapaian).id}
      />

      {/* Modal CRUD Pencapaian */}
      <Modal
        open={modalOpen}
        title={editTarget ? 'Edit Data Pencapaian' : 'Tambah Pencapaian Baru'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Nama Pencapaian *</label>
              <input
                value={fNama}
                onChange={e => setFNama(e.target.value)}
                placeholder="Misal: Juara Coding Skarlakes"
                className="input"
              />
            </div>
            
            <div className="form-group">
              <label className="label">EXP Reward *</label>
              <input
                type="number"
                min="0"
                value={fExpReward}
                onChange={e => setFExpReward(parseInt(e.target.value) || 0)}
                placeholder="Misal: 50"
                className="input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Icon Badge *</label>
              <Select
                value={fIcon}
                onChange={setFIcon}
                options={ICON_OPTIONS}
              />
            </div>

            <div className="form-group">
              <label className="label">Organisasi Penyelenggara *</label>
              <Select
                value={fOrganisasi}
                onChange={v => setFOrganisasi(v as any)}
                options={[
                  { value: 'programming', label: 'Programming' },
                  { value: 'english', label: 'English Club' },
                  { value: 'osis', label: 'OSIS' },
                  { value: 'mpk', label: 'MPK' }
                ]}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Deskripsi & Syarat Pencapaian *</label>
            <textarea
              value={fDeskripsi}
              onChange={e => setFDeskripsi(e.target.value)}
              placeholder="Jelaskan kontribusi atau prestasi apa yang harus dipenuhi oleh siswa untuk mendapatkan achievement ini..."
              className="input h-24 py-2 resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Modal Award Achievement to Student */}
      <Modal
        open={awardModalOpen}
        title="Berikan Pencapaian (Award Member)"
        onClose={() => setAwardModalOpen(false)}
        size="md"
        footer={
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAwardModalOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={handleAward} disabled={awarding || !selectedMemberId} className="btn-primary">
              {awarding ? <><Loader2 className="w-4 h-4 animate-spin" />Mengirim...</> : 'Berikan Penghargaan'}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Achievement Summary Card */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-deep-navy border border-white/10 shadow flex items-center justify-center shrink-0">
              {awardTarget && getLucideIcon(awardTarget.icon)}
            </div>
            <div>
              <h4 className="font-extrabold text-white">{awardTarget?.nama_pencapaian}</h4>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">{awardTarget?.deskripsi}</p>
              <div className="flex items-center gap-2 mt-2">
                <OrgBadge org={awardTarget?.organisasi || 'programming'} />
                <span className="inline-flex items-center gap-0.5 font-bold font-mono text-[10px] text-[#2e7d32] bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-lg shadow-sm">
                  ⚡ +{awardTarget?.exp_reward} EXP
                </span>
              </div>
            </div>
          </div>

          {/* Member Dropdown Picker */}
          <div className="form-group">
            <label className="label">Pilih Anggota *</label>
            {loadingMembers ? (
              <div className="p-3 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-xs text-slate-400 bg-white/5">
                <Loader2 className="w-4 h-4 animate-spin" /> Memuat daftar anggota...
              </div>
            ) : members.length === 0 ? (
              <div className="p-3 border border-white/10 rounded-xl text-center text-xs text-red-500 bg-red-500/10">
                Belum ada anggota yang terdaftar di organisasi ini.
              </div>
            ) : (
              <Select
                value={selectedMemberId}
                onChange={setSelectedMemberId}
                placeholder="Pilih Anggota..."
                options={members.map(m => ({
                  value: m.id.toString(),
                  label: `${m.nama} (${m.kelas})`
                }))}
              />
            )}
          </div>

          {/* Live Progress Preview */}
          {activeMember && awardTarget && (
            <div className="p-4 bg-[#1E90FF]/10 border border-[#1E90FF]/30 rounded-2xl space-y-3">
              <h5 className="text-[10px] font-black uppercase text-white tracking-wider leading-none">PREVIEW UPDATE EXP</h5>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{activeMember.nama}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">{activeMember.kelas}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <LevelBadge exp={activeMember.xp} size="sm" />
                  <span className="text-xs text-slate-400">➡️</span>
                  <LevelBadge exp={activeMember.xp + awardTarget.exp_reward} size="sm" />
                </div>
              </div>

              {/* Progress visual */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 font-mono">
                  <span>Current: {activeMember.xp} EXP</span>
                  <span className="text-[#2e7d32] font-black">+{awardTarget.exp_reward} EXP (New: {activeMember.xp + awardTarget.exp_reward} EXP)</span>
                </div>
                <ExpProgressBar exp={activeMember.xp} />
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Confirm Delete template dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Pencapaian?"
        message={`Template pencapaian "${deleteTarget?.nama_pencapaian}" akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
