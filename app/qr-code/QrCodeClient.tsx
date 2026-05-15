'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { clearJsonCache, fetchJsonCached, seedJsonCache } from '@/lib/client-cache'
import { formatDateTime } from '@/lib/utils'
import { CheckCircle2, Download, Loader2, Plus, QrCode, ShieldCheck, TriangleAlert, Trash2, Save, X } from 'lucide-react'

const Modal = dynamic(() => import('@/components/ui/Modal'))
const ConfirmDialog = dynamic(() => import('@/components/ui/ConfirmDialog'))
const QR_CACHE_KEY = 'wawancara:qr'
const QR_CACHE_TTL = 60_000

interface QrItem {
  id: number
  token: string
  aktif: boolean
  valid_from: string
  valid_until: string
  created_at: string
  creator: { nama: string }
  sesi: { id: number; status: string }
  _count: { antrian: number }
}

interface QrCodeClientProps {
  baseUrl: string
  initialItems: QrItem[]
}

interface QrListResponse {
  data: QrItem[]
}

export default function QrCodeClient({ baseUrl, initialItems }: QrCodeClientProps) {
  const [items, setItems] = useState<QrItem[]>(initialItems)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createModal, setCreateModal] = useState(false)
  const [fMulai, setFMulai] = useState('')
  const [fSelesai, setFSelesai] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteMode, setDeleteMode] = useState(false)
  const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null)

  const activeQr = items.find((item) => item.aktif)
  const activeUrl = useMemo(() => {
    if (!activeQr) return ''
    const origin = baseUrl || (typeof window === 'undefined' ? '' : window.location.origin)
    return origin ? `${origin}/wawancara/scan?token=${activeQr.token}` : ''
  }, [activeQr, baseUrl])
  const qrImage = activeUrl ? `https://quickchart.io/qr?size=360&text=${encodeURIComponent(activeUrl)}` : ''

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const json = await fetchJsonCached<QrListResponse>(QR_CACHE_KEY, '/api/wawancara/qr', { ttlMs: QR_CACHE_TTL })
      setItems(json.data || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memuat QR')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    seedJsonCache<QrListResponse>(QR_CACHE_KEY, { data: initialItems }, QR_CACHE_TTL)
  }, [initialItems])

  function datetimeLocalValue(date: Date) {
    const d = new Date(date)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  }

  function openCreateQr() {
    const now = new Date()
    const until = new Date(now)
    until.setDate(until.getDate() + 3)
    setFMulai(datetimeLocalValue(now))
    setFSelesai(datetimeLocalValue(until))
    setCreateModal(true)
  }

  async function createQr() {
    setCreating(true)
    const res = await fetch('/api/wawancara/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valid_from: fMulai ? new Date(fMulai).toISOString() : undefined,
        valid_until: fSelesai ? new Date(fSelesai).toISOString() : undefined,
      }),
    })
    const json = await res.json()
    if (!res.ok) toast.error(json.error || 'Gagal membuat QR')
    else {
      toast.success('QR baru berhasil dibuat')
      setCreateModal(false)
      clearJsonCache(QR_CACHE_KEY)
      load()
    }
    setCreating(false)
  }

  async function deleteQr(id: number) {
    const res = await fetch(`/api/wawancara/qr?id=${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) toast.error(json.error || 'Gagal menghapus QR')
    else {
      toast.success('QR berhasil dihapus')
      setDeleteId(null)
      setSelectedDeleteId(null)
      setDeleteMode(false)
      clearJsonCache(QR_CACHE_KEY)
      load()
    }
  }

  async function downloadQr() {
    if (!qrImage) return
    const res = await fetch(qrImage)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qr_wawancara_osis_mpk_${activeQr?.id}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  const expiredSoon = activeQr ? new Date(activeQr.valid_until).getTime() - Date.now() <= 24 * 60 * 60 * 1000 : false

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-5">
        <div className="page-header">
          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <QrCode className="w-5 h-5 text-indigo-500" />
              <h2 className="page-title">QR Code Absensi Wawancara</h2>
            </div>
            <p className="page-sub mt-0.5">Generate QR token unik yang valid 3 hari untuk gerbang absensi digital.</p>
          </div>
          <button onClick={openCreateQr} disabled={creating} className="btn-primary">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Buat QR Baru
          </button>
        </div>

        <div className="card p-5">
          {loading ? (
            <div className="empty-state"><Loader2 className="w-8 h-8 animate-spin" /><span>Memuat QR...</span></div>
          ) : !activeQr ? (
            <div className="empty-state"><QrCode className="w-12 h-12 opacity-30" /><span>Belum ada QR aktif. Aktifkan wawancara lalu buat QR baru.</span></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] gap-6 items-start">
              <div className="rounded-xl border border-slate-200 bg-white p-4 relative aspect-square w-full max-w-[360px]">
                <Image 
                  src={qrImage} 
                  alt="QR absensi wawancara" 
                  fill
                  unoptimized
                  priority
                  className="object-contain p-2" 
                />
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">QR Aktif</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">OSIS & MPK</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3"><div className="text-xs text-slate-500">Valid Dari</div><div className="text-sm font-bold">{formatDateTime(activeQr.valid_from)}</div></div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3"><div className="text-xs text-slate-500">Valid Sampai</div><div className="text-sm font-bold">{formatDateTime(activeQr.valid_until)}</div></div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3"><div className="text-xs text-slate-500">Scan Sah</div><div className="text-sm font-bold">{activeQr._count.antrian} data</div></div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3"><div className="text-xs text-slate-500">Dibuat Oleh</div><div className="text-sm font-bold">{activeQr.creator.nama}</div></div>
                </div>
                {expiredSoon && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700 flex gap-2">
                    <TriangleAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    QR akan expired kurang dari 24 jam. Buat QR baru sebelum digunakan lagi.
                  </div>
                )}
                <input value={activeUrl} readOnly className="input text-xs font-mono" onFocus={(e) => e.currentTarget.select()} />
                <button onClick={downloadQr} className="btn-secondary"><Download className="w-4 h-4" />Download QR</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-bold text-slate-800">Validasi Otomatis</h3>
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <div>GPS ≤ 50m: SAH.</div>
            <div>VPN Indonesia: SAH_DICURIGAI.</div>
            <div>VPN luar negeri: DITOLAK_VPN.</div>
            <div>GPS &gt; 50m: TIDAK_SAH.</div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-slate-800">Riwayat QR</div>
            {items.length > 0 && (
              <button
                onClick={() => {
                  setDeleteMode((value) => !value)
                  setSelectedDeleteId(null)
                }}
                className={deleteMode ? 'btn-secondary btn-sm text-slate-600' : 'btn-secondary btn-sm text-red-600'}
              >
                {deleteMode ? <X className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                {deleteMode ? 'Batal Pilih' : 'Pilih QR'}
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="p-5 text-sm text-slate-400">Belum ada riwayat.</div>
            ) : items.map((item) => (
              <div key={item.id} className={`p-4 ${deleteMode && selectedDeleteId === item.id ? 'bg-red-50/50' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {deleteMode && (
                      <button
                        onClick={() => setSelectedDeleteId(item.id)}
                        className={`w-7 h-7 rounded-full border flex items-center justify-center transition ${
                          selectedDeleteId === item.id
                            ? 'bg-red-600 border-red-600 text-white'
                            : 'bg-white border-slate-300 text-transparent hover:border-red-300 hover:bg-red-50'
                        }`}
                        title="Pilih QR ini"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    <span className={item.aktif ? 'badge bg-green-50 text-green-700 border border-green-200' : 'badge bg-slate-100 text-slate-500 border border-slate-200'}>{item.aktif ? 'Aktif' : 'Nonaktif'}</span>
                    <span className="text-xs text-slate-400">#{item.id}</span>
                  </div>
                  {!deleteMode && (
                    <button onClick={() => setDeleteId(item.id)} className="btn-icon text-red-500 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-2">Berlaku: {formatDateTime(item.valid_from)} - {formatDateTime(item.valid_until)}</div>
              </div>
            ))}
          </div>
          {deleteMode && (
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button onClick={() => { setDeleteMode(false); setSelectedDeleteId(null) }} className="btn-secondary btn-sm">Batal</button>
              <button onClick={() => selectedDeleteId && setDeleteId(selectedDeleteId)} disabled={!selectedDeleteId} className="btn-danger btn-sm">
                <Trash2 className="w-3.5 h-3.5" />
                Hapus QR Terpilih
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal open={createModal} title="Buat QR Code Baru" onClose={() => setCreateModal(false)} size="md"
        footer={<div className="flex justify-end gap-2"><button onClick={() => setCreateModal(false)} className="btn-secondary">Batal</button><button onClick={createQr} disabled={creating} className="btn-primary">{creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Buat QR</button></div>}>
        <div className="space-y-4">
          <div className="text-sm text-slate-600 leading-relaxed mb-4">
            Membuat QR baru akan menonaktifkan QR sebelumnya. Atur rentang waktu QR ini dapat di-scan oleh siswa.
          </div>
          <div className="form-group"><label className="label">Mulai Berlaku</label><input type="datetime-local" value={fMulai} onChange={(e) => setFMulai(e.target.value)} className="input" /></div>
          <div className="form-group"><label className="label">Berakhir Pada</label><input type="datetime-local" value={fSelesai} onChange={(e) => setFSelesai(e.target.value)} className="input" /></div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} title="Hapus QR Code?" message="QR Code ini akan dihapus permanen. Aksi ini tidak dapat dibatalkan."
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteQr(deleteId)}
      />
    </div>
  )
}
