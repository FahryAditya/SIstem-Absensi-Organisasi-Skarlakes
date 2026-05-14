'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { clearJsonCache, fetchJsonCachedUrl } from '@/lib/client-cache'
import { Loader2, MessageSquareText, Send, UserRoundCheck } from 'lucide-react'

interface Props {
  sesiId: string
  token: string
}

interface PublicSession {
  id: number
  organisasi_type: 'osis' | 'mpk'
  status: string
  _count: { antrian: number }
}

export default function ScanWawancaraClient({ sesiId, token }: Props) {
  const [session, setSession] = useState<PublicSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [nama, setNama] = useState('')
  const [kelas, setKelas] = useState('')
  const [queueNumber, setQueueNumber] = useState<number | null>(null)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [geoError, setGeoError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const params = token ? `token=${encodeURIComponent(token)}` : `sesi=${sesiId}`
      try {
        const json = await fetchJsonCachedUrl<{ data?: PublicSession }>(`/api/wawancara/public?${params}`)
        setSession(json.data || null)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Sesi tidak tersedia')
      }
      setLoading(false)
    }
    load()
  }, [sesiId, token])

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('HP/browser tidak mendukung GPS. Gunakan browser lain dan izinkan lokasi.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        setGeoError('')
      },
      () => setGeoError('Izin lokasi wajib diaktifkan sebelum submit.'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }, [])

  async function submit() {
    if (!nama.trim() || !kelas.trim()) {
      toast.error('Nama dan kelas wajib diisi')
      return
    }
    if (!coords) {
      toast.error(geoError || 'Lokasi GPS belum terbaca')
      return
    }
    setSaving(true)
    const res = await fetch('/api/wawancara/antrian', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sesi_id: sesiId ? Number(sesiId) : undefined,
        token: token || undefined,
        nama: nama.trim(),
        kelas: kelas.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error || 'Gagal masuk antrian')
      setSaving(false)
      return
    }
    setQueueNumber(json.data.nomor_antrian)
    toast.success(json.data.status_validasi === 'SAH_DICURIGAI' ? 'Masuk antrian dengan flag verifikasi' : 'Berhasil masuk antrian')
    clearJsonCache()
    setSaving(false)
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <MessageSquareText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900">Antrian Wawancara</h1>
              <p className="text-sm text-slate-500">OSIS & MPK</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm font-medium">Memeriksa sesi...</span>
          </div>
        ) : !session ? (
          <div className="p-8 text-center">
            <div className="text-base font-bold text-slate-800">Sesi tidak aktif</div>
            <p className="text-sm text-slate-500 mt-2">Silakan hubungi panitia untuk QR terbaru.</p>
          </div>
        ) : queueNumber ? (
          <div className="p-8 text-center">
            <UserRoundCheck className="w-14 h-14 text-green-600 mx-auto mb-4" />
            <div className="text-sm font-bold text-slate-500">Nomor Antrian</div>
            <div className="text-6xl font-black font-mono text-slate-900 mt-1">#{queueNumber}</div>
            <p className="text-sm text-slate-500 mt-4">Tunggu sampai nama Anda dipanggil oleh admin OSIS & MPK.</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
              <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Sesi Aktif</div>
              <div className="text-lg font-black text-indigo-900 mt-1">OSIS & MPK</div>
              <div className="text-xs text-indigo-700 mt-1">Antrian saat ini: {session._count.antrian} peserta</div>
            </div>
            <div className={`rounded-xl border p-3 text-xs ${coords ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
              {coords ? 'GPS terbaca. Sistem akan validasi jarak dari sekolah saat submit.' : (geoError || 'Membaca lokasi GPS...')}
            </div>
            <div className="form-group">
              <label className="label">Nama Lengkap *</label>
              <input value={nama} onChange={(e) => setNama(e.target.value)} className="input" placeholder="Isi nama lengkap" autoFocus />
            </div>
            <div className="form-group">
              <label className="label">Kelas *</label>
              <input value={kelas} onChange={(e) => setKelas(e.target.value)} className="input" placeholder="Contoh: X IPA 1" />
            </div>
            <button onClick={submit} disabled={saving} className="btn-primary w-full justify-center py-3">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Masuk Antrian
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
