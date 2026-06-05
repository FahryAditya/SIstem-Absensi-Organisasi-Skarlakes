'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Plus, Pencil, Trash2, Clock, MapPin, AlertCircle, ArrowLeft } from 'lucide-react'

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

const ORG_TABS = [
  { key: 'programming', label: 'Programming', color: 'from-blue-500 to-cyan-500', isEkskul: true },
  { key: 'english', label: 'English Club', color: 'from-emerald-500 to-teal-500', isEkskul: true },
  { key: 'osis', label: 'OSIS', color: 'from-purple-500 to-persian-blue/100', isEkskul: false },
  { key: 'mpk', label: 'MPK', color: 'from-orange-500 to-amber-500', isEkskul: false },
]

const emptyForm = { judul: '', tanggal: '', waktu: '', lokasi: '', keterangan: '', organisasi: 'programming', wajib_hadir: false }

function isUpcoming(tgl: string) {
  return new Date(tgl) >= new Date(new Date().toDateString())
}

export default function JadwalPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('programming')
  const [data, setData] = useState<JadwalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<JadwalItem | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetch_ = useCallback(async (org: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/jadwal?organisasi=${org}&limit=30`)
      const json = await res.json()
      setData(json.data || [])
    } catch { setData([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch_(activeTab) }, [activeTab, fetch_])

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
      const res = await fetch('/api/jadwal', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) { setShowModal(false); fetch_(activeTab) }
      else { const j = await res.json(); alert(j.error) }
    } finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus jadwal ini?')) return
    await fetch(`/api/jadwal?id=${id}`, { method: 'DELETE' })
    fetch_(activeTab)
  }

  const tabInfo = ORG_TABS.find(t => t.key === activeTab)!
  const upcoming = data.filter(d => isUpcoming(d.tanggal))
  const past = data.filter(d => !isUpcoming(d.tanggal))

  return (
    <div className="min-h-screen bg-[#0f1117] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        </div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="w-5 h-5 text-blue-400" />
              <h1 className="text-2xl font-bold">{tabInfo.isEkskul ? 'Jadwal Pengajar' : 'Pembawa Materi'}</h1>
            </div>
            <p className="text-slate-400 text-sm">{tabInfo.isEkskul ? 'Jadwal pengajar ekstrakurikuler' : 'Jadwal pembawa materi rapat organisasi'}</p>
          </div>
          <button onClick={openCreate}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${tabInfo.color} text-white font-medium text-sm hover:opacity-90 transition`}>
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {ORG_TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${activeTab === tab.key ? `bg-gradient-to-r ${tab.color} text-white border-transparent` : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}</div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Belum ada jadwal</p>
          </div>
        ) : (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Mendatang</h2>
                <div className="space-y-3">
                  {upcoming.map(item => <JadwalCard key={item.id} item={item} onEdit={openEdit} onDelete={handleDelete} color={tabInfo.color} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Sudah Lewat</h2>
                <div className="space-y-3 opacity-60">
                  {past.map(item => <JadwalCard key={item.id} item={item} onEdit={openEdit} onDelete={handleDelete} color={tabInfo.color} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d27] border border-white/10 rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold mb-5">{editItem ? 'Edit' : 'Tambah'} Jadwal</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Judul / Agenda</label>
                <input value={form.judul} onChange={e => setForm(f => ({ ...f, judul: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Judul jadwal..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tanggal</label>
                  <input type="date" value={form.tanggal} onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Jam Mulai</label>
                  <input type="time" value={form.waktu} onChange={e => setForm(f => ({ ...f, waktu: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Lokasi</label>
                <input value={form.lokasi} onChange={e => setForm(f => ({ ...f, lokasi: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Ruang / lokasi..." />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Keterangan</label>
                <textarea rows={2} value={form.keterangan} onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" placeholder="Keterangan tambahan..." />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.wajib_hadir} onChange={e => setForm(f => ({ ...f, wajib_hadir: e.target.checked }))} className="w-4 h-4 accent-red-500" />
                <span className="text-sm text-slate-300">Wajib Hadir</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 text-sm transition">Batal</button>
              <button onClick={handleSave} disabled={saving}
                className={`flex-1 py-2 rounded-xl bg-gradient-to-r ${tabInfo.color} text-white font-medium text-sm hover:opacity-90 transition disabled:opacity-50`}>
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
    <div className="flex gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all group">
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
        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
          {item.waktu && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.waktu}</span>}
          {item.lokasi && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.lokasi}</span>}
        </div>
        {item.keterangan && <p className="text-xs text-slate-400 mt-1.5">{item.keterangan}</p>}
      </div>
      <div className="flex items-start gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => onEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-400 transition"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => onDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
      </div>
    </div>
  )
}
