'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import Table from '@/components/ui/Table'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { RoleBadge } from '@/components/ui/Badges'
import { formatDateTime } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/auth-shared'
import { clearJsonCache, fetchJsonCachedUrl } from '@/lib/client-cache'
import { UserCog, Plus, Pencil, Trash2, Loader2, Shield, Mail, User, Lock, Eye, EyeOff, AlertTriangle, Database, Cpu, Sparkles, Trophy, UserCheck } from 'lucide-react'
import Select from '@/components/ui/Select'
import { AWARDS_DATA } from '@/lib/awards'

interface UserData { id: number; nama: string; email: string; role: string; created_at: string }
interface Props { user: { id: number; nama: string; email: string; role: string } }

export default function AdminClient({ user }: Props) {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<UserData | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showPass, setShowPass] = useState(false)

  // Optimize state hooks
  const [optimizeLoading, setOptimizeLoading] = useState(false)
  const [optimizeResult, setOptimizeResult] = useState<any>(null)
  const [optimizeModalOpen, setOptimizeModalOpen] = useState(false)

  // Email Setting state
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [fEmailSender, setFEmailSender] = useState('')
  const [fAppPassword, setFAppPassword] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)

  // Cleanup Interview state
  const [cleanupModalOpen, setCleanupModalOpen] = useState(false)
  const [cleanupType, setCleanupType] = useState<'sesi' | 'chat'>('chat')
  const [cleanupConfirmText, setCleanupConfirmText] = useState('')
  const [cleaning, setCleaning] = useState(false)

  const [fNama, setFNama] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fPassword, setFPassword] = useState('')
  const [fRole, setFRole] = useState<string>('admin_programming')

  const [awardModalOpen, setAwardModalOpen] = useState(false)
  const [awardOrg, setAwardOrg] = useState<string>('')
  const [awardStudentId, setAwardStudentId] = useState<number | null>(null)
  const [awardId, setAwardId] = useState<number | null>(null)
  const [givingAward, setGivingAward] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const json = await fetchJsonCachedUrl<{ data?: UserData[] }>('/api/users')
    setUsers(json.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function openEmailSetting() {
    setEmailModalOpen(true)
    setEmailLoading(true)
    try {
      const res = await fetch('/api/admin/email-setting')
      const json = await res.json()
      if (json.success && json.data) {
        setFEmailSender(json.data.email)
        setFAppPassword(json.data.appPassword || '')
      } else {
        setFEmailSender('')
        setFAppPassword('')
      }
    } catch (e) {
      toast.error('Gagal memuat pengaturan email')
    }
    setEmailLoading(false)
  }

  async function handleSaveEmail() {
    if (!fEmailSender.trim() || !fAppPassword.trim()) {
      toast.error('Email dan App Password wajib diisi')
      return
    }
    setSavingEmail(true)
    try {
      const res = await fetch('/api/admin/email-setting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fEmailSender.trim(), appPassword: fAppPassword.trim() })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan')
      toast.success('Pengaturan email berhasil disimpan')
      setEmailModalOpen(false)
    } catch (e: any) {
      toast.error(e.message)
    }
    setSavingEmail(false)
  }

  function openAdd() {
    setEditTarget(null); setFNama(''); setFEmail(''); setFPassword(''); setFRole('admin_programming')
    setShowPass(false); setModalOpen(true)
  }

  function openEdit(u: UserData) {
    setEditTarget(u); setFNama(u.nama); setFEmail(u.email); setFPassword(''); setFRole(u.role)
    setShowPass(false); setModalOpen(true)
  }

  async function handleSave() {
    if (!fNama.trim() || !fEmail.trim()) { toast.error('Nama dan email wajib diisi'); return }
    if (!editTarget && !fPassword) { toast.error('Password wajib diisi untuk user baru'); return }
    if (fPassword && fPassword.length < 6) { toast.error('Password minimal 6 karakter'); return }
    if (!/^[a-zA-Z\s.']*$/.test(fNama)) {
      toast.error('Nama hanya boleh berisi huruf dan simbol . \'')
      return
    }
    setSaving(true)

    const body: Record<string, unknown> = { nama: fNama.trim(), email: fEmail.trim(), role: fRole }
    if (fPassword) body.password = fPassword
    if (editTarget) body.id = editTarget.id

    const res = await fetch('/api/users', {
      method: editTarget ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Gagal menyimpan'); setSaving(false); return }
    toast.success(editTarget ? 'User diperbarui' : 'User berhasil dibuat')
    clearJsonCache()
    setSaving(false); setModalOpen(false); load()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/users?id=${deleteTarget.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Gagal menghapus'); setDeleting(false); return }
    toast.success('User dihapus')
    clearJsonCache()
    setDeleting(false); setDeleteTarget(null); load()
  }

  async function handleCleanup() {
    if (cleanupConfirmText !== 'HAPUS PERMANEN') {
      toast.error('Ketik HAPUS PERMANEN untuk konfirmasi')
      return
    }
    setCleaning(true)
    try {
      const res = await fetch('/api/admin/clear-wawancara', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipe: cleanupType, konfirmasi: cleanupConfirmText })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal membersihkan data')
      toast.success(`Berhasil menghapus ${cleanupType === 'sesi' ? 'Semua Sesi & Hasil' : 'Semua Live Chat'} (${json.count} data)`)
      setCleanupModalOpen(false)
      setCleanupConfirmText('')
    } catch (e: any) {
      toast.error(e.message)
    }
    setCleaning(false)
  }

  async function handleOptimize() {
    setOptimizeLoading(true)
    try {
      const res = await fetch('/api/admin/optimize', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal mengoptimalkan database')
      setOptimizeResult(json)
      toast.success('Database dioptimalkan sempurna!')
      setOptimizeModalOpen(true)
    } catch (e: any) {
      toast.error(e.message)
    }
    setOptimizeLoading(false)
  }

  const [students, setStudents] = useState<any[]>([])
  const [awards, setAwards] = useState<any[]>([])

  useEffect(() => {
    if (!awardOrg) return
    async function fetchData() {
      // Fetch students/members based on org
      let endpoint = ''
      
      if (awardOrg === 'osis' || awardOrg === 'mpk') {
        endpoint = `/api/organisasi?tipe=${awardOrg}`
      } else {
        // Set a high limit to get all students
        endpoint = `/api/siswa?ekskul=${awardOrg}&limit=1000`
      }
        
      const response = await fetch(endpoint)
      const studentData = await response.json()
      
      // Handle the fact that /api/organisasi might return object with keys or just data array
      // and /api/siswa returns { data: [] }
      let studentsList = []
      if (awardOrg === 'osis' && studentData.osis) studentsList = studentData.osis
      else if (awardOrg === 'mpk' && studentData.mpk) studentsList = studentData.mpk
      else if (studentData.data) studentsList = studentData.data
      else if (Array.isArray(studentData)) studentsList = studentData
      
      setStudents(studentsList)

      // Use local AWARDS_DATA
      setAwards(AWARDS_DATA[awardOrg] || [])
    }
    fetchData()
  }, [awardOrg])

  async function handleAwardSubmit() {
    if (!awardOrg || !awardStudentId || !awardId) {
      toast.error('Semua field wajib diisi')
      return
    }
    setGivingAward(true)
    const tipe = awardOrg === 'osis' ? 'anggota_osis' : awardOrg === 'mpk' ? 'anggota_mpk' : 'siswa'
    const res = await fetch('/api/pencapaian/berikan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pencapaian_id: awardId,
        penerima: [{ tipe_anggota: tipe, target_id: awardStudentId }]
      })
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error || 'Gagal memberikan penghargaan')
    } else {
      toast.success('Penghargaan berhasil diberikan')
      setAwardModalOpen(false)
    }
    setGivingAward(false)
  }

  // Stats by role
  const roleCount = (role: string) => users.filter(u => u.role === role).length

  const columns = [
    { key: 'nama', label: 'Nama', render: (u: UserData) => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-persian-blue/10 flex items-center justify-center text-persian-blue text-xs font-black flex-shrink-0">
          {u.nama.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-semibold text-white text-sm">{u.nama}</div>
          {u.id === user.id && <span className="text-[10px] text-persian-blue font-bold">● Anda</span>}
        </div>
      </div>
    )},
    { key: 'email', label: 'Email', render: (u: UserData) => <span className="text-xs text-slate-400 font-mono">{u.email}</span> },
    { key: 'password', label: 'Password', render: (u: UserData & { password?: string }) => (
      <span className="text-xs text-slate-400 font-mono">
        {u.password?.startsWith('$2') ? '(Teracak)' : (u.password || '-')}
      </span>
    )},
    { key: 'role', label: 'Role', render: (u: UserData) => <RoleBadge role={u.role} /> },
    { key: 'created_at', label: 'Dibuat', render: (u: UserData) => <span className="text-xs text-slate-400">{formatDateTime(u.created_at)}</span> },
    { key: 'actions', label: '', render: (u: UserData) => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(u)} className="btn-icon text-blue-400 hover:bg-persian-blue/10"><Pencil className="w-3.5 h-3.5" /></button>
        {u.id !== user.id && (
          <button onClick={() => setDeleteTarget(u)} className="btn-icon text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
        )}
      </div>
    )},
  ]

  const roleGroups = [
    { role: 'administrator', label: 'Administrator', color: 'bg-persian-blue/10 border-persian-blue/20 text-persian-blue', dot: 'bg-persian-blue' },
    { role: 'admin_programming', label: 'Admin Programming', color: 'bg-unit-programming/10 border-unit-programming/20 text-unit-programming', dot: 'bg-unit-programming' },
    { role: 'admin_english', label: 'Admin English', color: 'bg-unit-english/10 border-unit-english/20 text-blue-400', dot: 'bg-unit-english' },
    { role: 'admin_osis_mpk', label: 'Admin OSIS & MPK', color: 'bg-unit-osis/10 border-unit-osis/20 text-unit-osis', dot: 'bg-unit-osis' },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div className="flex-1">
          <div className="flex items-center gap-2.5"><UserCog className="w-5 h-5 text-persian-blue" /><h2 className="page-title">Kelola User & Admin</h2></div>
          <p className="page-sub mt-0.5">Buat, edit, dan hapus akun pengguna sistem</p>
        </div>
        <div className="flex gap-2">
          {user.role === 'administrator' && (
            <button onClick={openEmailSetting} className="btn-secondary text-persian-blue font-semibold">
              <Mail className="w-4 h-4" />
              Pengirim Email
            </button>
          )}
          {/* <button onClick={() => setAwardModalOpen(true)} className="btn-secondary text-persian-blue font-semibold">
            <Sparkles className="w-4 h-4" />
            Beri Penghargaan
          </button> */}
          <button onClick={handleOptimize} disabled={optimizeLoading} className="btn-secondary text-[#1E90FF] border-[#1E90FF]/20 hover:bg-[#1E90FF]/5">
            <span className="flex items-center gap-2 font-semibold">
              {optimizeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4 text-emerald-500" />}
              Optimalkan DB
            </span>
          </button>
          <button onClick={() => window.open('/api/admin/backup', '_blank')} className="btn-secondary">
            <span className="flex items-center gap-2 text-persian-blue font-semibold">
              <Database className="w-4 h-4" />
              Backup SQL
            </span>
          </button>
          <button onClick={() => window.location.href = '/admin/registration/acceptance'} className="btn-secondary border-blue-200 bg-blue-50/50 hover:bg-blue-100">
            <span className="flex items-center gap-2 text-blue-600 font-bold">
              <UserCheck className="w-4 h-4" />
              Penerimaan
            </span>
          </button>
          {user.role === 'administrator' && (
            <button onClick={() => setCleanupModalOpen(true)} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50">
              <span className="flex items-center gap-2 font-semibold">
                <Trash2 className="w-4 h-4" />
                Bersihkan Wawancara
              </span>
            </button>
          )}
          <button onClick={() => window.open('/api/export?tipe=admin', '_blank')} className="btn-secondary">
            <span className="flex items-center gap-2 text-persian-blue font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Export XLS
            </span>
          </button>
          <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" />Tambah User</button>
        </div>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {roleGroups.map(rg => (
          <div key={rg.role} className={`card p-4 border ${rg.color}`}>
            <div className="flex items-center gap-2 mb-1"><div className={`w-2 h-2 rounded-full ${rg.dot}`}/><span className="text-xs font-bold text-slate-300">{rg.label}</span></div>
            <div className="text-2xl font-black text-white font-mono">{roleCount(rg.role)}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <Table columns={columns} data={users} loading={loading} emptyMessage="Belum ada user" rowKey={(u: UserData) => u.id} />

      {/* Modal */}
      <Modal open={modalOpen} title={editTarget ? 'Edit User' : 'Tambah User Baru'} onClose={() => setModalOpen(false)} size="md"
        footer={
          <div className="flex gap-2 justify-end">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin"/>Menyimpan...</> : 'Simpan'}
            </button>
          </div>
        }>
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Nama Lengkap *</label>
            <div className="relative"><User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
              <input value={fNama} onChange={e => setFNama(e.target.value)} placeholder="Nama lengkap" className="input pl-10" autoFocus /></div>
          </div>
          <div className="form-group">
            <label className="label">Email *</label>
            <div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
              <input type="email" value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="email@domain.com" className="input pl-10" /></div>
          </div>
          <div className="form-group">
            <label className="label">{editTarget ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password *'}</label>
            <div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
              <input type={showPass ? 'text' : 'password'} value={fPassword} onChange={e => setFPassword(e.target.value)}
                placeholder={editTarget ? '(biarkan kosong)' : 'Min. 6 karakter'} className="input pl-10 pr-10" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="label">Role / Hak Akses *</label>
            <Select
              value={fRole}
              onChange={setFRole}
              options={Object.entries(ROLE_LABELS).map(([val, label]) => ({ value: val, label }))}
            />
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-white/10 flex gap-2.5 text-xs text-amber-400">
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5"/>
            <div><strong>Hak Akses:</strong><br/>
              <span className="text-unit-programming font-bold">Programming</span> → hanya data Programming<br/>
              <span className="text-blue-300">English</span> → hanya data English Club<br/>
              <span className="text-blue-300">OSIS & MPK</span> → hanya data OSIS & MPK<br/>
              <span className="text-amber-400">Administrator</span> → semua data + log aktivitas
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Hapus User?"
        message={`Akun "${deleteTarget?.nama}" (${ROLE_LABELS[deleteTarget?.role || ''] || deleteTarget?.role}) akan dihapus permanen.`}
        loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />

      {/* Modal Beri Penghargaan */}
      <Modal open={awardModalOpen} title="Beri Penghargaan" onClose={() => setAwardModalOpen(false)} size="md"
        footer={
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAwardModalOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={handleAwardSubmit} disabled={givingAward} className="btn-primary">
              {givingAward ? 'Mengirim...' : 'Berikan Penghargaan'}
            </button>
          </div>
        }>
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Organisasi *</label>
            <Select
              value={awardOrg}
              onChange={(val) => { setAwardOrg(val); setAwardStudentId(null); setAwardId(null) }}
              options={[
                { value: 'osis', label: 'OSIS' },
                { value: 'mpk', label: 'MPK' },
                { value: 'english', label: 'English Club' },
                { value: 'programming', label: 'Programming' },
              ]}
              placeholder="Pilih Organisasi"
            />
          </div>
          <div className="form-group">
            <label className="label">Siswa *</label>
            <Select
              value={awardStudentId ? awardStudentId.toString() : ''}
              onChange={(val) => setAwardStudentId(parseInt(val))}
              options={students.map(s => ({ value: s.id.toString(), label: s.nama }))}
              placeholder="Pilih Siswa"
              disabled={!awardOrg}
            />
          </div>
          <div className="form-group">
            <label className="label">Jenis Penghargaan *</label>
            <Select
              value={awardId ? awardId.toString() : ''}
              onChange={(val) => setAwardId(parseInt(val))}
              options={awards.map(a => ({ value: a.id.toString(), label: a.nama }))}
              placeholder="Pilih Penghargaan"
              disabled={!awardOrg}
            />
          </div>
        </div>
      </Modal>

      {/* Modal Hasil Optimasi */}
      <Modal
        open={optimizeModalOpen}
        title="Status Optimasi & Ukuran Database"
        onClose={() => setOptimizeModalOpen(false)}
        size="md"
        footer={
          <div className="flex gap-2 justify-end">
            <button onClick={() => setOptimizeModalOpen(false)} className="btn-primary">Selesai</button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-[#1E90FF]/20 border border-[#1E90FF]/40 rounded-2xl">
            <div className="flex items-center gap-2 text-white font-black mb-2.5">
              <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
              Database Dioptimalkan Sempurna!
            </div>
            <p className="text-xs text-[#7EA0C5] leading-relaxed">
              Query planner PostgreSQL telah disegarkan dengan menjalankan fungsi <code className="bg-white/60 px-1 rounded font-mono">ANALYZE</code>. Indeks relasi kini berjalan dengan efisiensi puncak.
            </p>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-deep-navy p-3 rounded-xl border border-white/10 shadow-sm text-center">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Log Pruned</span>
                <span className="text-sm font-black font-mono text-slate-200">+{optimizeResult?.summary?.prunedLogs || 0}</span>
              </div>
              <div className="bg-deep-navy p-3 rounded-xl border border-white/10 shadow-sm text-center">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">QR Pruned</span>
                <span className="text-sm font-black font-mono text-slate-200">+{optimizeResult?.summary?.prunedQrs || 0}</span>
              </div>
              <div className="bg-deep-navy p-3 rounded-xl border border-white/10 shadow-sm text-center">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Chats Pruned</span>
                <span className="text-sm font-black font-mono text-slate-200">+{optimizeResult?.summary?.prunedChats || 0}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white mb-2">Footprint Ukuran Tabel Live (PostgreSQL)</h4>
            <div className="border border-white/10 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-slate-400">
                    <th className="p-2.5 font-bold">Nama Tabel</th>
                    <th className="p-2.5 font-bold text-right">Ukuran Data + Index</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {optimizeResult?.tableSizes?.map((tbl: any) => (
                    <tr key={tbl.table_name} className="hover:bg-white/5 transition-colors">
                      <td className="p-2.5 font-mono text-slate-300 font-semibold">{tbl.table_name}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-200">{tbl.total_size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Pengaturan Email */}
      <Modal open={emailModalOpen} title="Pengaturan Email Pengirim" onClose={() => setEmailModalOpen(false)} size="md"
        footer={
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEmailModalOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={handleSaveEmail} disabled={savingEmail || emailLoading} className="btn-primary">
              {savingEmail ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        }>
        <div className="space-y-4">
          {emailLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="text-sm">Memuat pengaturan...</p>
            </div>
          ) : (
            <>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-blue-300 leading-relaxed">
                <div className="flex gap-2 font-bold mb-1"><Shield className="w-3.5 h-3.5" /> INFORMASI PENTING</div>
                Gunakan <strong>Sandi Aplikasi (App Password)</strong> Gmail 16-karakter. Jangan gunakan sandi utama akun Google Anda. Email ini akan digunakan oleh seluruh admin untuk mengirimkan pengumuman.
              </div>
              <div className="form-group">
                <label className="label">Alamat Email Gmail *</label>
                <div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                  <input type="email" value={fEmailSender} onChange={e => setFEmailSender(e.target.value)} placeholder="contoh@gmail.com" className="input pl-10" /></div>
              </div>
              <div className="form-group">
                <label className="label">Sandi Aplikasi (16 Karakter) *</label>
                <div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                  <input type="password" value={fAppPassword} onChange={e => setFAppPassword(e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx" className="input pl-10" /></div>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal Bersihkan Wawancara */}
      <Modal open={cleanupModalOpen} title="Bersihkan Data Wawancara" onClose={() => setCleanupModalOpen(false)} size="md"
        footer={
          <div className="flex gap-2 justify-end">
            <button onClick={() => setCleanupModalOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={handleCleanup} disabled={cleaning} className="btn-primary bg-red-600 hover:bg-red-700">
              {cleaning ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}
              Hapus Data
            </button>
          </div>
        }>
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 font-medium">
            <div className="flex gap-2 font-bold mb-1"><AlertTriangle className="w-4 h-4" /> PERINGATAN KERAS</div>
            Tindakan ini bersifat permanen dan tidak dapat dibatalkan. Data yang dihapus akan hilang selamanya dari database.
          </div>
          
          <div className="form-group">
            <label className="label">Pilih Data yang Akan Dihapus</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setCleanupType('sesi')}
                className={`p-3 rounded-xl border text-left transition-all ${cleanupType === 'sesi' ? 'bg-red-50 border-red-500 ring-1 ring-red-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
              >
                <div className="font-bold text-sm mb-1 text-slate-900">Hapus Sesi</div>
                <div className="text-[10px] text-slate-500">Menghapus semua sesi, antrian, hasil, dan chat.</div>
              </button>
              <button 
                onClick={() => setCleanupType('chat')}
                className={`p-3 rounded-xl border text-left transition-all ${cleanupType === 'chat' ? 'bg-red-50 border-red-500 ring-1 ring-red-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
              >
                <div className="font-bold text-sm mb-1 text-slate-900">Hapus Live Chat</div>
                <div className="text-[10px] text-slate-500">Hanya menghapus riwayat pesan live chat internal.</div>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="label">Konfirmasi Penghapusan</label>
            <p className="text-[11px] text-slate-500 mb-2">Ketik <span className="font-mono font-bold text-red-600">HAPUS PERMANEN</span> untuk melanjutkan:</p>
            <input 
              value={cleanupConfirmText} 
              onChange={e => setCleanupConfirmText(e.target.value)} 
              placeholder="HAPUS PERMANEN" 
              className="input border-red-200 focus:ring-red-500/20" 
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
