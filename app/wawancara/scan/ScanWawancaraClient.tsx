'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { clearJsonCache, fetchJsonCachedUrl } from '@/lib/client-cache'
import { Loader2, MessageSquareText, Send, UserRoundCheck } from 'lucide-react'
import { motion } from 'framer-motion'

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
  const [tingkat, setTingkat] = useState('X')
  const [jurusan, setJurusan] = useState('AKL')
  const [organisasi, setOrganisasi] = useState<'osis'|'mpk'>('osis')
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
    const namaRegex = /^[A-Za-z\s.'-]+$/
    if (!nama.trim() || !namaRegex.test(nama)) {
      toast.error('Nama hanya boleh berisi huruf, spasi, titik, dan apostrof')
      return
    }
    if (!coords) {
      toast.error(geoError || 'Lokasi GPS belum terbaca')
      return
    }
    setSaving(true)
    const kelasGabungan = `[${organisasi.toUpperCase()}] ${tingkat} ${jurusan}`
    const res = await fetch('/api/wawancara/antrian', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sesi_id: sesiId ? Number(sesiId) : undefined,
        token: token || undefined,
        nama: nama.trim(),
        kelas: kelasGabungan,
        organisasi,
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
      <motion.div 
        initial={{ y: 30, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white border border-slate-200/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100/50 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-inner shadow-white/20">
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-4">
            <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100/60 p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-200/40 to-purple-200/40 blur-3xl -mr-10 -mt-10 rounded-full" />
              <div className="relative">
                <div className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest bg-indigo-100/50 inline-block px-2 py-0.5 rounded-md mb-2">Sesi Aktif</div>
                <div className="text-xl font-black text-slate-900 mt-1">OSIS & MPK</div>
                <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Antrian saat ini: <span className="font-bold text-slate-700">{session._count.antrian}</span> peserta
                </div>
              </div>
            </div>
            <div className={`rounded-xl border p-3 text-xs flex items-start gap-2 ${coords ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
              {coords ? 'GPS terbaca. Sistem akan validasi jarak dari sekolah saat submit.' : (geoError || 'Membaca lokasi GPS...')}
            </div>
            <div className="form-group">
              <label className="label">Nama Lengkap *</label>
              <input value={nama} onChange={(e) => setNama(e.target.value)} className="input" placeholder="Isi nama lengkap" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="label">Tingkat *</label>
                <select value={tingkat} onChange={(e) => setTingkat(e.target.value)} className="input">
                  <option value="X">X</option>
                  <option value="XI">XI</option>
                  <option value="XII">XII</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Jurusan *</label>
                <select value={jurusan} onChange={(e) => setJurusan(e.target.value)} className="input">
                  <optgroup label="SMK Airlangga (Skarla)">
                    <option value="AKL">AKL</option>
                    <option value="PPLG">PPLG</option>
                    <option value="DKV">DKV</option>
                    <option value="MPLB 1">MPLB 1</option>
                    <option value="MPLB 2">MPLB 2</option>
                    <option value="TJKT 1">TJKT 1</option>
                    <option value="TJKT 2">TJKT 2</option>
                  </optgroup>
                  <optgroup label="SMK Kesehatan (Skakes)">
                    <option value="Kesehatan 1">Kesehatan 1</option>
                    <option value="Kesehatan 2">Kesehatan 2</option>
                    <option value="Kesehatan 3">Kesehatan 3</option>
                    <option value="Kesehatan 4">Kesehatan 4</option>
                    <option value="Kesehatan 5">Kesehatan 5</option>
                    <option value="Kesehatan 6">Kesehatan 6</option>
                  </optgroup>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Pilih Organisasi *</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setOrganisasi('osis')} 
                  className={`py-3 px-4 rounded-xl border-2 font-bold transition-all text-center ${organisasi === 'osis' ? 'border-transparent bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md transform scale-[1.02]' : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:bg-slate-50'}`}
                >
                  OSIS
                </button>
                <button 
                  onClick={() => setOrganisasi('mpk')} 
                  className={`py-3 px-4 rounded-xl border-2 font-bold transition-all text-center ${organisasi === 'mpk' ? 'border-transparent bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md transform scale-[1.02]' : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:bg-slate-50'}`}
                >
                  MPK
                </button>
              </div>
            </div>
            <button onClick={submit} disabled={saving} className="btn-primary w-full justify-center py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 shadow-lg mt-2">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Masuk Antrian
            </button>
          </motion.div>
        )}
      </motion.div>
    </main>
  )
}
