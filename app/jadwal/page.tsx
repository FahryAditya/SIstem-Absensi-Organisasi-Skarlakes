'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Plus, Pencil, Trash2, Clock, MapPin, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'

interface JadwalItem {
  id: number
  judul: string
  tanggal: string
  waktu?: string | null
  lokasi?: string | null
  keterangan?: string | null
  organisasi: string
  wajib_hadir: boolean
}

const emptyForm = { judul: '', tanggal: '', waktu: '', lokasi: '', keterangan: '', organisasi: 'programming', wajib_hadir: false }

function isUpcoming(tgl: string) {
  return new Date(tgl) >= new Date(new Date().toDateString())
}

export default function JadwalPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [myOrgs, setMyOrgs] = useState<{ slug: string; nama: string }[]>([])
  const [activeTab, setActiveTab] = useState('')
  const [data, setData] = useState<JadwalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<JadwalItem | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        const [uRes, oRes] = await Promise.all([
          fetch('/api/auth/me').then(r => r.json()),
          fetch('/api/organizations?mode=mine').then(r => r.json())
        ])
        
        if (uRes.user) {
          setUser(uRes.user)
          if (oRes.success && oRes.data) {
            setMyOrgs(oRes.data)
            if (oRes.data.length > 0) setActiveTab(oRes.data[0].slug)
          }
        } else {
          router.push('/login')
        }
      } catch {
        router.push('/login')
      } finally {
        setAuthLoading(false)
      }
    }
    init()
  }, [router])

  const fetch_ = useCallback(async (org: string) => {
    if (!org) return
    setLoading(true)
    try {
      const res = await fetch(`/api/jadwal?organisasi=${org}&limit=30`)
      const json = await res.json()
      setData(json.data || [])
    } catch { setData([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { if (activeTab) fetch_(activeTab) }, [activeTab, fetch_])

  if (authLoading) return (
    <div className="min-h-screen bg-royal-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-royal-500" />
    </div>
  )

  const currentOrg = myOrgs.find(o => o.slug === activeTab)
  const isEkskul = !['osis', 'mpk'].includes(activeTab)

  const getGradColor = (slug: string) => {
    if (slug === 'programming') return 'from-royal-600 to-royal-800'
    if (slug === 'english') return 'from-royal-600 to-royal-800'
    if (slug === 'osis') return 'from-royal-600 to-royal-800'
    if (slug === 'mpk') return 'from-yellow-bright-500 to-yellow-bright-600'
    return 'from-royal-700 to-royal-500'
  }

  const gradColor = getGradColor(activeTab)

  function openCreate() {
    setForm({ ...emptyForm, organisasi: activeTab })
    setEditItem(null)
    setShowModal(true)
  }

  function openEdit(item: JadwalItem) {
    setForm({
      judul: item.judul, tanggal: item.tanggal.split('T')[0],
      waktu: item.waktu ?? '', lokasi: item.lokasi ?? '',
      keterangan: item.keterangan ?? '', organisasi: item.organisasi,
      wajib_hadir: item.wajib_hadir,
    })
    setEditItem(item)
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const method = editItem ? 'PUT' : 'POST'
      const body = editItem ? { ...form, id: editItem.id } : form
      const res = await fetch('/api/jadwal', { 
        method, 
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString(),
          'x-user-nama': user.nama,
          'x-user-role': user.role,
        }, 
        body: JSON.stringify(body) 
      })
      if (res.ok) { setShowModal(false); fetch_(activeTab) }
      else { const j = await res.json(); alert(j.error) }
    } finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus jadwal ini?')) return
    await fetch(`/api/jadwal?id=${id}`, { 
      method: 'DELETE',
      headers: {
        'x-user-id': user.id.toString(),
        'x-user-nama': user.nama,
        'x-user-role': user.role,
      }
    })
    fetch_(activeTab)
  }

  const upcoming = data.filter(d => isUpcoming(d.tanggal))
  const past = data.filter(d => !isUpcoming(d.tanggal))

  return (
    <div className="min-h-screen bg-royal-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-royal-300 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        </div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="w-5 h-5 text-yellow-bright-400" />
              <h1 className="text-2xl font-bold">{isEkskul ? 'Jadwal Pengajar' : 'Pembawa Materi'}</h1>
            </div>
            <p className="text-royal-300 text-sm">{isEkskul ? 'Jadwal pengajar ekstrakurikuler' : 'Jadwal pembawa materi rapat organisasi'}</p>
          </div>
          {myOrgs.length > 0 && (
            <button onClick={openCreate}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${gradColor} text-white font-medium text-sm hover:opacity-90 transition`}>
              <Plus className="w-4 h-4" /> Tambah
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {myOrgs.map(tab => (
            <button key={tab.slug} onClick={() => setActiveTab(tab.slug)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${activeTab === tab.slug ? `bg-gradient-to-r ${getGradColor(tab.slug)} text-white border-transparent` : 'bg-royal-800/50 border-royal-700 text-royal-300 hover:bg-royal-800/80'}`}>
              {tab.nama}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-royal-800/50 rounded-2xl animate-pulse" />)}</div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 text-royal-300">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Belum ada jadwal</p>
          </div>
        ) : (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-royal-300 uppercase tracking-wider mb-3">Mendatang</h2>
                <div className="space-y-3">
                  {upcoming.map(item => <JadwalCard key={item.id} item={item} onEdit={openEdit} onDelete={handleDelete} color={gradColor} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-royal-300 uppercase tracking-wider mb-3">Sudah Lewat</h2>
                <div className="space-y-3 opacity-60">
                  {past.map(item => <JadwalCard key={item.id} item={item} onEdit={openEdit} onDelete={handleDelete} color={gradColor} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-royal-900 border border-royal-700 rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold mb-5">{editItem ? 'Edit' : 'Tambah'} Jadwal</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-royal-300 mb-1">Judul / Agenda</label>
                <input value={form.judul} onChange={e => setForm(f => ({ ...f, judul: e.target.value }))}
                  className="w-full bg-royal-800/50 border border-royal-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-royal-500" placeholder="Judul jadwal..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-royal-300 mb-1">Tanggal</label>
                  <input type="date" value={form.tanggal} onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))}
                    className="w-full bg-royal-800/50 border border-royal-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-royal-500" />
                </div>
                <div>
                  <label className="block text-xs text-royal-300 mb-1">Jam Mulai</label>
                  <input type="time" value={form.waktu} onChange={e => setForm(f => ({ ...f, waktu: e.target.value }))}
                    className="w-full bg-royal-800/50 border border-royal-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-royal-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-royal-300 mb-1">Lokasi</label>
                <input value={form.lokasi} onChange={e => setForm(f => ({ ...f, lokasi: e.target.value }))}
                  className="w-full bg-royal-800/50 border border-royal-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-royal-500" placeholder="Ruang / lokasi..." />
              </div>
              <div>
                <label className="block text-xs text-royal-300 mb-1">Keterangan</label>
                <textarea rows={2} value={form.keterangan} onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))}
                  className="w-full bg-royal-800/50 border border-royal-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-royal-500 resize-none" placeholder="Keterangan tambahan..." />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.wajib_hadir} onChange={e => setForm(f => ({ ...f, wajib_hadir: e.target.checked }))} className="w-4 h-4 accent-red-500" />
                <span className="text-sm text-royal-200">Wajib Hadir</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-xl border border-royal-700 text-royal-300 hover:bg-royal-800/50 text-sm transition">Batal</button>
              <button onClick={handleSave} disabled={saving}
                className={`flex-1 py-2 rounded-xl bg-gradient-to-r ${gradColor} text-white font-medium text-sm hover:opacity-90 transition disabled:opacity-50`}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function JadwalCard({ item, onEdit, onDelete, color }: { item: JadwalItem; onEdit: (i: JadwalItem) => void; onDelete: (id: number) => void; color: string }) {
  const tgl = new Date(item.tanggal)
  return (
    <div className="flex gap-4 bg-royal-800/50 border border-royal-700 rounded-2xl p-4 hover:border-royal-600 transition-all group">
      <div className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex flex-col items-center justify-center text-white`}>
        <span className="text-xs font-medium">{tgl.toLocaleString('id-ID', { month: 'short' })}</span>
        <span className="text-lg font-bold leading-none">{tgl.getDate()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className="font-semibold text-white">{item.judul}</h3>
          {item.wajib_hadir && (
            <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3" /> Wajib Hadir
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-royal-300 flex-wrap">
          {item.waktu && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.waktu}</span>}
          {item.lokasi && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.lokasi}</span>}
        </div>
        {item.keterangan && <p className="text-xs text-royal-300 mt-1.5">{item.keterangan}</p>}
      </div>
      <div className="flex items-start gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => onEdit(item)} className="p-1.5 text-royal-300 hover:text-yellow-bright-400 transition"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => onDelete(item.id)} className="p-1.5 text-royal-300 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
      </div>
    </div>
  )
}
