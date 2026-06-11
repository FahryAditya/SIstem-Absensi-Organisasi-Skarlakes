'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import Table from '@/components/ui/Table'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { ShieldCheck, UserPlus, Trash2, Mail, Shield, Loader2, User as UserIcon } from 'lucide-react'
import { RoleBadge } from '@/components/ui/Badges'
import { clearJsonCache, fetchJsonCachedUrl } from '@/lib/client-cache'
import Select from '@/components/ui/Select'

interface OrgAdmin {
  id: number
  user_id: number
  organization_id: number
  user: {
    id: number
    nama: string
    email: string
    role: string
  }
}

interface User {
  id: number
  nama: string
  email: string
  role: string
}

interface Props {
  slug: string
  orgName: string
}

export default function AdminsClient({ slug, orgName }: Props) {
  const [admins, setAdmins] = useState<OrgAdmin[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<OrgAdmin | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [selectedUserId, setSelectedUserId] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [adminsJson, usersJson] = await Promise.all([
        fetchJsonCachedUrl<{ data?: OrgAdmin[] }>(`/api/organizations/${slug}/admins`),
        fetchJsonCachedUrl<{ data?: User[] }>('/api/users')
      ])
      setAdmins(adminsJson.data || [])
      setUsers(usersJson.data || [])
    } catch (e) {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { loadData() }, [loadData])

  async function handleAssign() {
    if (!selectedUserId) {
      toast.error('Pilih user terlebih dahulu')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/organizations/${slug}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: parseInt(selectedUserId) })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menambahkan admin')
      
      toast.success('Administrator berhasil ditambahkan')
      clearJsonCache()
      setModalOpen(false)
      setSelectedUserId('')
      loadData()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/organizations/${slug}/admins?id=${deleteTarget.id}`, {
        method: 'DELETE'
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus admin')
      
      toast.success('Administrator berhasil dihapus')
      clearJsonCache()
      setDeleteTarget(null)
      loadData()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setDeleting(false)
    }
  }

  // Filter out users who are already admins
  const availableUsers = users.filter(u => !admins.some(a => a.user_id === u.id))

  const columns = [
    { key: 'nama', label: 'Nama Administrator', render: (a: OrgAdmin) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold text-xs">
          {a.user.nama.charAt(0).toUpperCase()}
        </div>
        <div className="font-bold text-white text-sm">{a.user.nama}</div>
      </div>
    )},
    { key: 'email', label: 'Email', render: (a: OrgAdmin) => (
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
        <Mail className="w-3.5 h-3.5" />
        {a.user.email}
      </div>
    )},
    { key: 'role', label: 'System Role', render: (a: OrgAdmin) => <RoleBadge role={a.user.role} /> },
    { key: 'actions', label: '', render: (a: OrgAdmin) => (
      <button 
        onClick={() => setDeleteTarget(a)}
        className="btn-icon text-red-400 hover:bg-red-500/10"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    )}
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            Administrator Unit
          </h2>
          <p className="text-xs text-slate-400 mt-1">Kelola user yang memiliki akses penuh ke unit {orgName}</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <UserPlus className="w-4 h-4" />
          Assign Admin Baru
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Table 
            columns={columns} 
            data={admins} 
            loading={loading} 
            emptyMessage="Belum ada administrator yang ditugaskan ke unit ini" 
            rowKey={(a: OrgAdmin) => a.id} 
          />
        </div>

        <div className="space-y-4">
          <div className="card p-5 bg-indigo-500/5 border border-indigo-500/10">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs mb-3 uppercase tracking-wider">
              <Shield className="w-4 h-4" /> Informasi Akses
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Administrator Unit memiliki izin untuk:
            </p>
            <ul className="mt-3 space-y-2 text-[11px] text-slate-300">
              <li className="flex items-center gap-2">• Mengelola database anggota</li>
              <li className="flex items-center gap-2">• Mencatat absensi & kas harian</li>
              <li className="flex items-center gap-2">• Mengatur profil & jadwal unit</li>
              <li className="flex items-center gap-2">• Memberikan poin/XP ke anggota</li>
            </ul>
          </div>
        </div>
      </div>

      <Modal 
        open={modalOpen} 
        title="Assign Admin Baru" 
        onClose={() => setModalOpen(false)} 
        size="sm"
        footer={
          <div className="flex gap-2 justify-end">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={handleAssign} disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Assign User'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300">
            Pilih user yang ingin diberikan akses sebagai administrator untuk unit <strong>{orgName}</strong>.
          </div>
          <div className="form-group">
            <label className="label">Pilih User *</label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10"/>
              <Select
                value={selectedUserId}
                onChange={setSelectedUserId}
                options={availableUsers.map(u => ({
                  value: u.id.toString(),
                  label: `${u.nama} (${u.email})`
                }))}
                placeholder="Cari User..."
              />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog 
        open={!!deleteTarget} 
        title="Hapus Hak Akses Admin?" 
        message={`User "${deleteTarget?.user.nama}" tidak akan bisa lagi mengakses workspace unit ${orgName}.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
