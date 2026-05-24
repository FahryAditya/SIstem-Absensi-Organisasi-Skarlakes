'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Plus, Pencil, Trash2, Gift, Sparkles, Loader2, CheckSquare, Square, ArrowLeft } from 'lucide-react'

interface Pencapaian {
  id: number
  icon: string
  nama: string
  deskripsi: string
  exp_reward: number
  organisasi: string
}

interface Recipient {
  id: number
  nama: string
  kelas: string | null
  jabatan?: string | null
  tipe_anggota: 'siswa' | 'anggota_osis' | 'anggota_mpk'
}

const ORG_OPTIONS = ['programming', 'english', 'osis', 'mpk', 'semua']

const emptyForm = { icon: 'star', nama: '', deskripsi: '', exp_reward: 10, organisasi: 'programming' }

export default function PencapaianPage() {
  const router = useRouter()
  const [data, setData] = useState<Pencapaian[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Pencapaian | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterOrg, setFilterOrg] = useState('')
  const [giveTarget, setGiveTarget] = useState<Pencapaian | null>(null)
  const [recipientOrg, setRecipientOrg] = useState<'programming' | 'english' | 'osis' | 'mpk'>('programming')
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([])
  const [loadingRecipients, setLoadingRecipients] = useState(false)
  const [giving, setGiving] = useState(false)

  const fetch_ = useCallback(async (org?: string) => {
    setLoading(true)
    try {
      const qs = org ? `?organisasi=${org}` : ''
      const res = await fetch(`/api/pencapaian${qs}`)
      const json = await res.json()
      setData(json.data || [])
    } catch { setData([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch_(filterOrg || undefined) }, [filterOrg, fetch_])

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => setUserRole(d.user?.role || ''))
      .catch(() => {})
  }, [])

  const isAdministrator = userRole === 'administrator'

  function openCreate() { setForm({ ...emptyForm }); setEditItem(null); setShowModal(true) }
  function openEdit(item: Pencapaian) {
    setForm({ icon: item.icon, nama: item.nama, deskripsi: item.deskripsi, exp_reward: item.exp_reward, organisasi: item.organisasi })
    setEditItem(item); setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const method = editItem ? 'PUT' : 'POST'
      const body = editItem ? { ...form, id: editItem.id } : form
      const res = await fetch('/api/pencapaian', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) { setShowModal(false); fetch_(filterOrg || undefined) }
      else { const j = await res.json(); alert(j.error) }
    } finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus pencapaian ini?')) return
    await fetch(`/api/pencapaian?id=${id}`, { method: 'DELETE' })
    fetch_(filterOrg || undefined)
  }

  const loadRecipients = useCallback(async (org: string) => {
    setLoadingRecipients(true)
    setSelectedRecipients([])
    try {
      const url = org === 'programming' || org === 'english'
        ? `/api/siswa?ekskul=${org}&limit=100`
        : `/api/organisasi?tipe=${org}&limit=100`
      const res = await fetch(url)
      const json = await res.json()
      const tipe = org === 'programming' || org === 'english'
        ? 'siswa'
        : org === 'osis'
          ? 'anggota_osis'
          : 'anggota_mpk'
      setRecipients((json.data || []).map((item: any) => ({ ...item, tipe_anggota: tipe })))
    } catch {
      setRecipients([])
    } finally {
      setLoadingRecipients(false)
    }
  }, [])

  function openGive(item: Pencapaian) {
    const initialOrg = item.organisasi === 'semua' ? 'programming' : item.organisasi as 'programming' | 'english' | 'osis' | 'mpk'
    setGiveTarget(item)
    setRecipientOrg(initialOrg)
    loadRecipients(initialOrg)
  }

  async function handleGiveAchievement() {
    if (!giveTarget || selectedRecipients.length === 0) return
    setGiving(true)
    try {
      const penerima = recipients
        .filter((r) => selectedRecipients.includes(r.id))
        .map((r) => ({ tipe_anggota: r.tipe_anggota, target_id: r.id }))
      const res = await fetch('/api/pencapaian/berikan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pencapaian_id: giveTarget.id, penerima }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal memberikan pencapaian')
      const berhasil = (json.results || []).filter((r: any) => r.status === 'berhasil').length
      const duplikat = (json.results || []).filter((r: any) => r.status === 'duplikat_dilewati').length
      alert(`Pencapaian berhasil diberikan ke ${berhasil} anggota${duplikat ? `, ${duplikat} duplikat dilewati` : ''}.`)
      setGiveTarget(null)
      setSelectedRecipients([])
    } catch (error: any) {
      alert(error.message || 'Gagal memberikan pencapaian')
    } finally {
      setGiving(false)
    }
  }

  const ORG_COLORS: Record<string, string> = {
    programming: 'from-blue-500 to-cyan-500',
    english: 'from-emerald-500 to-teal-500',
    osis: 'from-purple-500 to-violet-500',
    mpk: 'from-orange-500 to-amber-500',
    semua: 'from-pink-500 to-rose-500',
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        </div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h1 className="text-2xl font-bold">Kelola Pencapaian</h1>
            </div>
            <p className="text-slate-400 text-sm">Buat, edit, dan berikan pencapaian ke anggota</p>
          </div>
          {isAdministrator && (
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium text-sm hover:opacity-90 transition">
              <Plus className="w-4 h-4" /> Buat Pencapaian
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button onClick={() => setFilterOrg('')}
            className={`px-4 py-1.5 rounded-full text-sm border transition-all ${!filterOrg ? 'bg-white/20 border-white/30 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
            Semua
          </button>
          {ORG_OPTIONS.map(org => (
            <button key={org} onClick={() => setFilterOrg(org)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-all capitalize ${filterOrg === org ? `bg-gradient-to-r ${ORG_COLORS[org]} text-white border-transparent` : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
              {org}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-36 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Belum ada pencapaian</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map(item => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all group relative overflow-hidden">
                <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${ORG_COLORS[item.organisasi] ?? 'from-slate-500 to-gray-500'}`} />
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ORG_COLORS[item.organisasi] ?? 'from-slate-500 to-gray-500'} flex items-center justify-center`}>
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isAdministrator && (
                        <>
                          <button onClick={() => openEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-400 transition"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                    </div>
                  </div>
                  <h3 className="font-semibold text-white mb-1">{item.nama}</h3>
                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">{item.deskripsi}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${ORG_COLORS[item.organisasi] ?? 'from-slate-500 to-gray-500'} text-white capitalize`}>{item.organisasi}</span>
                    <span className="flex items-center gap-1 text-yellow-400 font-semibold text-sm">
                      <Sparkles className="w-3.5 h-3.5" />+{item.exp_reward} EXP
                    </span>
                  </div>
                  <button
                    onClick={() => openGive(item)}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 hover:bg-white/10 transition">
                    <Gift className="w-3.5 h-3.5" /> Berikan ke Anggota
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d27] border border-white/10 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-5">{editItem ? 'Edit' : 'Buat'} Pencapaian</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nama Pencapaian</label>
                <input value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500" placeholder="Nama pencapaian..." />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Icon (nama Material Icon)</label>
                <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500" placeholder="star, emoji_events, ..." />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Deskripsi</label>
                <textarea rows={2} value={form.deskripsi} onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 resize-none" placeholder="Penjelasan pencapaian..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">EXP Reward</label>
                  <input type="number" min="1" value={form.exp_reward} onChange={e => setForm(f => ({ ...f, exp_reward: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Organisasi</label>
                  <select value={form.organisasi} onChange={e => setForm(f => ({ ...f, organisasi: e.target.value }))}
                    className="w-full bg-[#0f1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500">
                    {ORG_OPTIONS.map(o => <option key={o} value={o} className="capitalize">{o}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 text-sm transition">Batal</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium text-sm hover:opacity-90 transition disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {giveTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d27] border border-white/10 rounded-2xl w-full max-w-xl p-6">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold">Berikan Pencapaian</h2>
                <p className="text-sm text-slate-400">{giveTarget.nama} · +{giveTarget.exp_reward} EXP</p>
              </div>
              <button onClick={() => setGiveTarget(null)} className="text-slate-400 hover:text-white">Tutup</button>
            </div>

            {giveTarget.organisasi === 'semua' && (
              <div className="flex gap-2 flex-wrap mb-4">
                {ORG_OPTIONS.filter(o => o !== 'semua').map(org => (
                  <button
                    key={org}
                    onClick={() => {
                      const nextOrg = org as 'programming' | 'english' | 'osis' | 'mpk'
                      setRecipientOrg(nextOrg)
                      loadRecipients(nextOrg)
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs border transition capitalize ${recipientOrg === org ? `bg-gradient-to-r ${ORG_COLORS[org]} text-white border-transparent` : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                  >
                    {org}
                  </button>
                ))}
              </div>
            )}

            <div className="max-h-80 overflow-y-auto rounded-xl border border-white/10 divide-y divide-white/10">
              {loadingRecipients ? (
                <div className="p-10 flex items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> Memuat anggota...
                </div>
              ) : recipients.length === 0 ? (
                <div className="p-10 text-center text-slate-500">Belum ada anggota</div>
              ) : recipients.map((recipient) => {
                const checked = selectedRecipients.includes(recipient.id)
                return (
                  <button
                    key={`${recipient.tipe_anggota}-${recipient.id}`}
                    onClick={() => setSelectedRecipients(prev => checked ? prev.filter(id => id !== recipient.id) : [...prev, recipient.id])}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition"
                  >
                    {checked ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{recipient.nama}</p>
                      <p className="text-xs text-slate-400">{recipient.kelas || '-'}{recipient.jabatan ? ` · ${recipient.jabatan}` : ''}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setGiveTarget(null)} className="flex-1 py-2 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 text-sm transition">Batal</button>
              <button
                onClick={handleGiveAchievement}
                disabled={giving || selectedRecipients.length === 0}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {giving ? <><Loader2 className="w-4 h-4 animate-spin" />Mengirim...</> : `Berikan (${selectedRecipients.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
