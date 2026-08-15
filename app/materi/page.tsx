'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, FileText, Plus, Pencil, Trash2, Calendar, MapPin, ChevronDown, ArrowLeft, Loader2 } from 'lucide-react'
import { getAccessibleOrgs } from '@/lib/auth-shared'

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
  programming: 'from-royal-600 to-royal-800',
  english: 'from-royal-600 to-royal-800',
  osis: 'from-royal-600 to-royal-800',
  mpk: 'from-yellow-bright-500 to-yellow-bright-600',
}

const emptyForm = { judul: '', deskripsi: '', tanggal: '', organisasi: 'programming', notulen: '', lokasi: '' }

export default function MateriPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [myOrgs, setMyOrgs] = useState<{ slug: string; nama: string }[]>([])
  const [activeTab, setActiveTab] = useState('')
  const [data, setData] = useState<MateriItem[]>([])
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<MateriItem | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

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

  const currentOrg = myOrgs.find(o => o.slug === activeTab)
  const isEkskul = !['osis', 'mpk'].includes(activeTab)

  const fetch_ = useCallback(async (org: string) => {
    if (!org) return
    setLoading(true)
    try {
      const res = await fetch(`/api/materi?organisasi=${org}`)
      const json = await res.json()
      setData(json.data || [])
    } catch { setData([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { 
    if (activeTab) fetch_(activeTab) 
  }, [activeTab, fetch_])

  if (authLoading) return (
    <div className="min-h-screen bg-royal-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-royal-500" />
    </div>
  )

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
      const res = await fetch('/api/materi', { 
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
    if (!confirm('Hapus materi ini?')) return
    await fetch(`/api/materi?id=${id}`, { 
      method: 'DELETE',
      headers: {
        'x-user-id': user.id.toString(),
        'x-user-nama': user.nama,
        'x-user-role': user.role,
      }
    })
    fetch_(activeTab)
  }

  const getGradColor = (slug: string) => {
    if (slug === 'programming') return 'from-royal-600 to-royal-800'
    if (slug === 'english') return 'from-royal-600 to-royal-800'
    if (slug === 'osis') return 'from-royal-600 to-royal-800'
    if (slug === 'mpk') return 'from-yellow-bright-500 to-yellow-bright-600'
    return 'from-royal-700 to-royal-500'
  }

  const gradColor = getGradColor(activeTab)

  return (
    <div className="min-h-screen bg-royal-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-royal-300 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        </div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isEkskul ? <BookOpen className="w-5 h-5 text-yellow-bright-400" /> : <FileText className="w-5 h-5 text-royal-400" />}
              <h1 className="text-2xl font-bold">{isEkskul ? 'Materi Hari Ini' : 'Jadwal Rapat'}</h1>
            </div>
            <p className="text-royal-300 text-sm">{isEkskul ? 'Dokumentasi materi pertemuan ekskul' : 'Notulen dan agenda rapat organisasi'}</p>
          </div>
          {myOrgs.length > 0 && (
            <button
              onClick={openCreate}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${gradColor} text-white font-medium text-sm hover:opacity-90 transition`}
            >
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

        {/* Content */}
        {loading ? (
          <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-royal-800/50 rounded-2xl animate-pulse" />)}</div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 text-royal-300">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Belum ada {isEkskul ? 'materi' : 'notulen rapat'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map(item => (
              <div key={item.id} className="bg-royal-800/50 border border-royal-700 rounded-2xl overflow-hidden hover:border-royal-600 transition-all">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-white">{item.judul}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${gradColor} text-white`}>{item.organisasi}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-royal-300">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        {item.lokasi && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.lokasi}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className="p-1.5 text-royal-300 hover:text-white transition"><ChevronDown className={`w-4 h-4 transition-transform ${expandedId === item.id ? 'rotate-180' : ''}`} /></button>
                      <button onClick={() => openEdit(item)} className="p-1.5 text-royal-300 hover:text-yellow-bright-400 transition"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-royal-300 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
                {expandedId === item.id && (
                  <div className="border-t border-royal-800 px-4 pb-4 pt-3 space-y-3">
                    <div>
                      <p className="text-xs text-royal-300 uppercase font-medium mb-1">{isEkskul ? 'Deskripsi' : 'Agenda'}</p>
                      <p className="text-sm text-royal-200 whitespace-pre-wrap">{item.deskripsi}</p>
                    </div>
                    {item.notulen && (
                      <div>
                        <p className="text-xs text-royal-300 uppercase font-medium mb-1">Notulen</p>
                        <p className="text-sm text-royal-200 whitespace-pre-wrap">{item.notulen}</p>
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
          <div className="bg-royal-900 border border-royal-700 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto flex flex-col">
            <h2 className="text-lg font-bold mb-5">{editItem ? 'Edit' : 'Tambah'} {isEkskul ? 'Materi' : 'Notulen Rapat'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-royal-300 mb-1">Judul</label>
                <input value={form.judul} onChange={e => setForm(f => ({ ...f, judul: e.target.value }))}
                  className="w-full bg-royal-800/50 border border-royal-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-royal-500" placeholder="Judul materi / rapat..." />
              </div>
              <div>
                <label className="block text-xs text-royal-300 mb-1">Tanggal</label>
                <input type="date" value={form.tanggal} onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))}
                  className="w-full bg-royal-800/50 border border-royal-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-royal-500" />
              </div>
              <div>
                <label className="block text-xs text-royal-300 mb-1">{isEkskul ? 'Deskripsi / Isi Materi' : 'Agenda'}</label>
                <textarea rows={3} value={form.deskripsi} onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))}
                  className="w-full bg-royal-800/50 border border-royal-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-royal-500 resize-none" placeholder="Isi materi / agenda rapat..." />
              </div>
              {!isEkskul && (
                <>
                  <div>
                    <label className="block text-xs text-royal-300 mb-1">Lokasi</label>
                    <input value={form.lokasi} onChange={e => setForm(f => ({ ...f, lokasi: e.target.value }))}
                      className="w-full bg-royal-800/50 border border-royal-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-royal-500" placeholder="Ruang / lokasi rapat..." />
                  </div>
                  <div>
                    <label className="block text-xs text-royal-300 mb-1">Notulen</label>
                    <textarea rows={3} value={form.notulen} onChange={e => setForm(f => ({ ...f, notulen: e.target.value }))}
                      className="w-full bg-royal-800/50 border border-royal-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-royal-500 resize-none" placeholder="Hasil / keputusan rapat..." />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-xl border border-royal-700 text-royal-300 hover:bg-royal-800/80 text-sm transition">Batal</button>
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
