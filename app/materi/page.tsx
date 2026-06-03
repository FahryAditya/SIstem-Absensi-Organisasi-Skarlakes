'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, FileText, Plus, Pencil, Trash2, Calendar, MapPin, ChevronDown, ArrowLeft } from 'lucide-react'

interface MateriItem {
  id: number
  judul: string
  deskripsi: string
  tanggal: string
  organisasi: string
  notulen?: string | null
  lokasi?: string | null
}

const ORG_TABS = [
  { key: 'programming', label: 'Programming', isEkskul: true },
  { key: 'english', label: 'English Club', isEkskul: true },
  { key: 'osis', label: 'OSIS', isEkskul: false },
  { key: 'mpk', label: 'MPK', isEkskul: false },
]

const ORG_COLORS: Record<string, string> = {
  programming: 'from-blue-500 to-cyan-500',
  english: 'from-emerald-500 to-teal-500',
  osis: 'from-purple-500 to-violet-500',
  mpk: 'from-orange-500 to-amber-500',
}

const emptyForm = { judul: '', deskripsi: '', tanggal: '', organisasi: 'programming', notulen: '', lokasi: '' }

export default function MateriPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('programming')
  const [data, setData] = useState<MateriItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<MateriItem | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const isEkskul = ORG_TABS.find(t => t.key === activeTab)?.isEkskul ?? true

  const fetch_ = useCallback(async (org: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/materi?organisasi=${org}`)
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

  function openEdit(item: MateriItem) {
    setForm({
      judul: item.judul, deskripsi: item.deskripsi,
      tanggal: item.tanggal.split('T')[0],
      organisasi: item.organisasi,
      notulen: item.notulen ?? '', lokasi: item.lokasi ?? '',
    })
    setEditItem(item)
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const method = editItem ? 'PUT' : 'POST'
      const body = editItem ? { ...form, id: editItem.id } : form
      const res = await fetch('/api/materi', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) { setShowModal(false); fetch_(activeTab) }
      else { const j = await res.json(); alert(j.error) }
    } finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus materi ini?')) return
    await fetch(`/api/materi?id=${id}`, { method: 'DELETE' })
    fetch_(activeTab)
  }

  const gradColor = ORG_COLORS[activeTab]

  return (
    <div className="min-h-screen bg-[#0f1117] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        </div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isEkskul ? <BookOpen className="w-5 h-5 text-blue-400" /> : <FileText className="w-5 h-5 text-purple-400" />}
              <h1 className="text-2xl font-bold">{isEkskul ? 'Materi Hari Ini' : 'Jadwal Rapat'}</h1>
            </div>
            <p className="text-slate-400 text-sm">{isEkskul ? 'Dokumentasi materi pertemuan ekskul' : 'Notulen dan agenda rapat organisasi'}</p>
          </div>
          <button
            onClick={openCreate}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${gradColor} text-white font-medium text-sm hover:opacity-90 transition`}
          >
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {ORG_TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${activeTab === tab.key ? `bg-gradient-to-r ${ORG_COLORS[tab.key]} text-white border-transparent` : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}</div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Belum ada {isEkskul ? 'materi' : 'notulen rapat'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map(item => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-white">{item.judul}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${gradColor} text-white`}>{item.organisasi}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        {item.lokasi && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.lokasi}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className="p-1.5 text-slate-400 hover:text-white transition"><ChevronDown className={`w-4 h-4 transition-transform ${expandedId === item.id ? 'rotate-180' : ''}`} /></button>
                      <button onClick={() => openEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-400 transition"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
                {expandedId === item.id && (
                  <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-medium mb-1">{isEkskul ? 'Deskripsi' : 'Agenda'}</p>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{item.deskripsi}</p>
                    </div>
                    {item.notulen && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-medium mb-1">Notulen</p>
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">{item.notulen}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d27] border border-white/10 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto flex flex-col">
            <h2 className="text-lg font-bold mb-5">{editItem ? 'Edit' : 'Tambah'} {isEkskul ? 'Materi' : 'Notulen Rapat'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Judul</label>
                <input value={form.judul} onChange={e => setForm(f => ({ ...f, judul: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Judul materi / rapat..." />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Tanggal</label>
                <input type="date" value={form.tanggal} onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">{isEkskul ? 'Deskripsi / Isi Materi' : 'Agenda'}</label>
                <textarea rows={3} value={form.deskripsi} onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" placeholder="Isi materi / agenda rapat..." />
              </div>
              {!isEkskul && (
                <>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Lokasi</label>
                    <input value={form.lokasi} onChange={e => setForm(f => ({ ...f, lokasi: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Ruang / lokasi rapat..." />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Notulen</label>
                    <textarea rows={3} value={form.notulen} onChange={e => setForm(f => ({ ...f, notulen: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" placeholder="Hasil / keputusan rapat..." />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 text-sm transition">Batal</button>
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
