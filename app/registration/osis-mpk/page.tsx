'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, AlertCircle, Loader2, ArrowLeft, ChevronDown } from 'lucide-react'

interface MasterData {
  kelas: { id: number; kelas_nama: string }[]
  kejuruan: { id: number; kejuruan_kode: string; skill_group: string }[]
}

function RegistrationOsisMpkContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orgType = searchParams.get('org') // 'osis' or 'mpk'
  const qrToken = searchParams.get('qr_token')

  const [master, setMaster] = useState<MasterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
  const [checkingEmail, setCheckingEmail] = useState(false)

  const [formData, setFormData] = useState({
    nama_peserta: '',
    kelas: '',
    kejuruan: '',
    email_gmail: '',
    nisn: '',
  })

  const [org, setOrg] = useState<{ id: number; nama: string } | null>(null)

  useEffect(() => {
    async function init() {
      try {
        const [masterRes, orgsRes] = await Promise.all([
          fetch('/api/registration/master'),
          fetch('/api/organizations')
        ])

        const masterData = await masterRes.json()
        const orgsResponse = await orgsRes.json()
        const orgsData = orgsResponse.data || []

        setMaster(masterData)
        
        const currentOrg = orgsData.find((o: any) => o.tipe === orgType)
        if (currentOrg) {
          setOrg(currentOrg)
        } else {
          setError('Organisasi tidak valid')
        }
      } catch (err) {
        setError('Gagal memuat data. Silakan coba lagi.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [orgType])

  const checkEmail = async (email: string) => {
    if (!email.endsWith('@gmail.com')) {
      setEmailAvailable(null)
      return
    }

    setCheckingEmail(true)
    try {
      const res = await fetch(`/api/registration/check-email?email=${email}&type=osis-mpk&orgId=${org?.id}`)
      const data = await res.json()
      setEmailAvailable(data.available)
    } catch (err) {
      console.error(err)
    } finally {
      setCheckingEmail(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email_gmail) {
        checkEmail(formData.email_gmail)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [formData.email_gmail, org])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailAvailable) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/registration/osis-mpk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          organization_id: org?.id,
          qr_token: qrToken
        })
      })

      const result = await res.json()

      if (res.ok) {
        router.push(`/registration/success?type=osis-mpk&name=${encodeURIComponent(formData.nama_peserta)}&org=${encodeURIComponent(org?.nama || '')}`)
      } else {
        setError(result.error || 'Terjadi kesalahan')
      }
    } catch (err) {
      setError('Gagal mengirim pendaftaran')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#001F3F]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    )
  }

  if (error && !org) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#001F3F] p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center relative z-10">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Oops!</h1>
          <p className="text-blue-100/60 mb-6">{error}</p>
          <button onClick={() => router.push('/registration')} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all">
            Kembali ke Pilihan
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#001F3F] py-12 px-4 relative overflow-hidden flex flex-col items-center">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      <div className="max-w-xl w-full relative z-10">
        <button 
          onClick={() => router.push('/registration')}
          className="flex items-center gap-2 text-indigo-300 hover:text-white mb-8 transition-colors group slide-up"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Kembali ke Pilihan</span>
        </button>

        <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/10 slide-up">
          <div className="bg-gradient-to-br from-indigo-600/80 to-purple-700/80 p-8 text-white text-center border-b border-white/10">
            <h1 className="text-3xl font-bold mb-2">Pendaftaran Organisasi</h1>
            <p className="text-indigo-100/80 font-medium">{org?.nama}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-indigo-200/70 ml-1">Nama Lengkap</label>
              <input
                required
                type="text"
                placeholder="Contoh: Ahmad Rifki Pratama"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.nama_peserta}
                onChange={(e) => setFormData({ ...formData, nama_peserta: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-indigo-200/70 ml-1">Kelas</label>
                <div className="relative group">
                  <select
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer group-hover:bg-white/10"
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                  >
                    <option value="" className="bg-[#001F3F]">Pilih Kelas</option>
                    {master?.kelas.map((k) => (
                      <option key={k.id} value={k.kelas_nama} className="bg-[#001F3F]">{k.kelas_nama}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none group-hover:text-white transition-colors" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-indigo-200/70 ml-1">Kejuruan</label>
                <div className="relative group">
                  <select
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer group-hover:bg-white/10"
                    value={formData.kejuruan}
                    onChange={(e) => setFormData({ ...formData, kejuruan: e.target.value })}
                  >
                    <option value="" className="bg-[#001F3F]">Pilih Kejuruan</option>
                    <optgroup label="SKARLA" className="bg-[#001F3F] font-bold text-indigo-400">
                      {master?.kejuruan.filter(k => k.skill_group === 'SKARLA').map((k) => (
                        <option key={k.id} value={k.kejuruan_kode} className="bg-[#001F3F] text-white">{k.kejuruan_kode}</option>
                      ))}
                    </optgroup>
                    <optgroup label="SKAKES" className="bg-[#001F3F] font-bold text-indigo-400">
                      {master?.kejuruan.filter(k => k.skill_group === 'SKAKES').map((k) => (
                        <option key={k.id} value={k.kejuruan_kode} className="bg-[#001F3F] text-white">{k.kejuruan_kode}</option>
                      ))}
                    </optgroup>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-indigo-200/70 ml-1">Email Gmail</label>
              <div className="relative">
                <input
                  required
                  type="email"
                  placeholder="nama@gmail.com"
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder:text-white/20 outline-none transition-all ${
                    emailAvailable === true ? 'border-green-500/50 ring-green-500/10 ring-4' : 
                    emailAvailable === false ? 'border-red-500/50 ring-red-500/10 ring-4' : 'border-white/10 focus:ring-2 focus:ring-indigo-500'
                  }`}
                  value={formData.email_gmail}
                  onChange={(e) => setFormData({ ...formData, email_gmail: e.target.value })}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {checkingEmail && <Loader2 className="w-5 h-5 animate-spin text-white/20" />}
                  {emailAvailable === true && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                  {emailAvailable === false && <AlertCircle className="w-5 h-5 text-red-400" />}
                </div>
              </div>
              {emailAvailable === false && (
                <p className="text-xs text-red-400 font-medium ml-1">Email sudah terdaftar di organisasi ini</p>
              )}
              <p className="text-xs text-indigo-200/30 mt-1 ml-1">*Wajib menggunakan email @gmail.com</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-indigo-200/70 ml-1">NISN (Opsional)</label>
              <input
                type="text"
                placeholder="10 digit nomor NISN"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.nisn}
                onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
              />
            </div>

            <button
              disabled={submitting || emailAvailable === false || checkingEmail}
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-xl font-bold shadow-xl shadow-indigo-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 mt-8"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Daftar Sebagai Calon'
              )}
            </button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

export default function RegistrationOsisMpkPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#001F3F]"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>}>
      <RegistrationOsisMpkContent />
    </Suspense>
  )
}
