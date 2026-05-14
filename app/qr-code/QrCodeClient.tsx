'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { formatDateTime } from '@/lib/utils'
import { Download, Loader2, Plus, QrCode, ShieldCheck, TriangleAlert } from 'lucide-react'

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

export default function QrCodeClient() {
  const [items, setItems] = useState<QrItem[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const activeQr = items.find((item) => item.aktif)
  const activeUrl = useMemo(() => {
    if (typeof window === 'undefined' || !activeQr) return ''
    return `${window.location.origin}/wawancara/scan?token=${activeQr.token}`
  }, [activeQr])
  const qrImage = activeUrl ? `https://quickchart.io/qr?size=360&text=${encodeURIComponent(activeUrl)}` : ''

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/wawancara/qr')
    const json = await res.json()
    if (!res.ok) toast.error(json.error || 'Gagal memuat QR')
    else setItems(json.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function createQr() {
    setCreating(true)
    const res = await fetch('/api/wawancara/qr', { method: 'POST' })
    const json = await res.json()
    if (!res.ok) toast.error(json.error || 'Gagal membuat QR')
    else {
      toast.success('QR baru berhasil dibuat')
      load()
    }
    setCreating(false)
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
          <button onClick={createQr} disabled={creating} className="btn-primary">
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
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <img src={qrImage} alt="QR absensi wawancara" className="w-full aspect-square object-contain" />
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
          <div className="px-5 py-4 border-b border-slate-100 text-sm font-bold text-slate-800">Riwayat QR</div>
          <div className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="p-5 text-sm text-slate-400">Belum ada riwayat.</div>
            ) : items.map((item) => (
              <div key={item.id} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className={item.aktif ? 'badge bg-green-50 text-green-700 border border-green-200' : 'badge bg-slate-100 text-slate-500 border border-slate-200'}>{item.aktif ? 'Aktif' : 'Nonaktif'}</span>
                  <span className="text-xs text-slate-400">#{item.id}</span>
                </div>
                <div className="text-xs text-slate-500 mt-2">Expired: {formatDateTime(item.valid_until)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
