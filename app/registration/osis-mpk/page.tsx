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
      <div className="min-h-screen flex items-center justify-center bg-[#000B18]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    )
  }

  if (error && !org) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000B18] p-4 relative overflow-hidden">
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
    <div className="min-h-screen bg-[#000B18] py-20 px-4 relative overflow-hidden flex flex-col items-center font-sans">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="max-w-2xl w-full relative z-10">
        <button 
          onClick={() => router.push('/registration')}
          className="flex items-center gap-3 text-slate-400 hover:text-white mb-10 transition-all group slide-up px-2"
        >
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="text-sm font-semibold tracking-wide">Kembali ke Pilihan</span>
        </button>

        <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden border border-white/10 slide-up">
          <div className="bg-gradient-to-br from-indigo-600/20 to-purple-700/20 p-10 text-center border-b border-white/5 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Formulir Organisasi</h1>
            <p className="text-indigo-400 font-bold uppercase tracking-[0.2em] text-[10px]">{org?.nama}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-8">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400 text-sm animate-shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Identitas Calon</label>
              <div className="space-y-4">
                <div className="group relative">
                  <input
                    required
                    type="text"
                    placeholder="Nama Lengkap"
                    className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all group-hover:bg-white/[0.05]"
                    value={formData.nama_peserta}
                    onChange={(e) => setFormData({ ...formData, nama_peserta: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative group">
                    <select
                      required
                      className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer group-hover:bg-white/[0.05]"
                      value={formData.kelas}
                      onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    >
                      <option value="" className="bg-[#000B18]">Pilih Kelas</option>
                      {master?.kelas.map((k) => (
                        <option key={k.id} value={k.kelas_nama} className="bg-[#000B18]">{k.kelas_nama}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none group-hover:text-white transition-colors" />
                  </div>

                  <div className="relative group">
                    <select
                      required
                      className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer group-hover:bg-white/[0.05]"
                      value={formData.kejuruan}
                      onChange={(e) => setFormData({ ...formData, kejuruan: e.target.value })}
                    >
                      <option value="" className="bg-[#000B18]">Pilih Kejuruan</option>
                      <optgroup label="SKARLA" className="bg-[#000B18] font-bold text-indigo-400">
                        {master?.kejuruan.filter(k => k.skill_group === 'SKARLA').map((k) => (
                          <option key={k.id} value={k.kejuruan_kode} className="bg-[#000B18] text-white">{k.kejuruan_kode}</option>
                        ))}
                      </optgroup>
                      <optgroup label="SKAKES" className="bg-[#000B18] font-bold text-indigo-400">
                        {master?.kejuruan.filter(k => k.skill_group === 'SKAKES').map((k) => (
                          <option key={k.id} value={k.kejuruan_kode} className="bg-[#000B18] text-white">{k.kejuruan_kode}</option>
                        ))}
                      </optgroup>
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none group-hover:text-white transition-colors" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Kredensial Siswa</label>
              <div className="space-y-4">
                <div className="relative group">
                  <input
                    required
                    type="email"
                    placeholder="Email Gmail Aktif"
                    className={`w-full px-6 py-4 rounded-2xl bg-white/[0.03] border text-white placeholder:text-white/20 outline-none transition-all group-hover:bg-white/[0.05] ${
                      emailAvailable === true ? 'border-green-500/50 ring-4 ring-green-500/10' : 
                      emailAvailable === false ? 'border-red-500/50 ring-4 ring-red-500/10' : 'border-white/10 focus:ring-2 focus:ring-indigo-500'
                    }`}
                    value={formData.email_gmail}
                    onChange={(e) => setFormData({ ...formData, email_gmail: e.target.value })}
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2">
                    {checkingEmail && <Loader2 className="w-5 h-5 animate-spin text-white/20" />}
                    {emailAvailable === true && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                    {emailAvailable === false && <AlertCircle className="w-5 h-5 text-red-400" />}
                  </div>
                </div>

                <div className="group relative">
                  <input
                    type="text"
                    placeholder="Nomor NISN (Opsional)"
                    className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all group-hover:bg-white/[0.05]"
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <button
              disabled={submitting || emailAvailable === false || checkingEmail}
              type="submit"
              className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-900/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3 mt-10"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Mendaftarkan...
                </>
              ) : (
                'Daftar Sekarang'
              )}
            </button>
          </form>
        </div>
        
        <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600">
          Aspirasi Anda adalah masa depan SKARLAKES
        </p>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-up {
          animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  )
}

export default function RegistrationOsisMpkPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#000B18]"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>}>
      <RegistrationOsisMpkContent />
    </Suspense>
  )
}
