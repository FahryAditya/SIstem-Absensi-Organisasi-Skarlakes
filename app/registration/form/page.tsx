'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, AlertCircle, Loader2, ArrowLeft, ChevronDown } from 'lucide-react'

interface MasterData {
  kelas: { id: number; kelas_nama: string }[]
  kejuruan: { id: number; kejuruan_kode: string; skill_group: string }[]
}

function RegistrationFormContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orgId = searchParams.get('orgId')

  const [master, setMaster] = useState<MasterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
  const [checkingEmail, setCheckingEmail] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    class: '',
    major: '',
    email: '',
    nisn: '',
  })

  const [org, setOrg] = useState<{ id: number; nama: string } | null>(null)

  useEffect(() => {
    async function init() {
      if (!orgId) {
        setError('ID Organisasi tidak ditemukan')
        setLoading(false)
        return
      }

      try {
        const [masterRes, orgRes] = await Promise.all([
          fetch('/api/registration/master'),
          fetch(`/api/organizations`)
        ])

        const masterData = await masterRes.json()
        const orgsResponse = await orgRes.json()
        const orgsData = orgsResponse.data || []

        setMaster(masterData)
        
        const currentOrg = orgsData.find((o: any) => o.id === parseInt(orgId))
        if (currentOrg) {
          setOrg(currentOrg)
        } else {
          setError('Organisasi tidak ditemukan')
        }
      } catch (err) {
        setError('Gagal memuat data. Silakan coba lagi.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [orgId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          organization_id: org?.id
        })
      })

      const result = await res.json()

      if (res.ok) {
        router.push(`/registration/success?name=${encodeURIComponent(formData.name)}&org=${encodeURIComponent(org?.nama || '')}`)
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
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#000B18] py-20 px-4 relative overflow-hidden flex flex-col items-center font-sans">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="max-w-2xl w-full relative z-10">
        <button 
          onClick={() => router.push('/registration')}
          className="flex items-center gap-3 text-slate-400 hover:text-white mb-10 transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-semibold tracking-wide">Kembali</span>
        </button>

        <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[2rem] shadow-2xl overflow-hidden border border-white/10">
          <div className="bg-gradient-to-br from-blue-600/20 to-indigo-700/20 p-8 text-center border-b border-white/5">
            <h1 className="text-3xl font-black text-white mb-2">Pendaftaran Anggota</h1>
            <p className="text-blue-400 font-bold uppercase tracking-widest text-[10px]">{org?.nama}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="form-group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Nama Lengkap</label>
                <input
                  required
                  type="text"
                  className="w-full px-5 py-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Kelas</label>
                  <select
                    required
                    className="w-full px-5 py-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-white outline-none appearance-none"
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  >
                    <option value="">Pilih Kelas</option>
                    {master?.kelas.map((k) => (
                      <option key={k.id} value={k.kelas_nama} className="bg-[#000B18]">{k.kelas_nama}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Kejuruan</label>
                  <select
                    required
                    className="w-full px-5 py-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-white outline-none appearance-none"
                    value={formData.major}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                  >
                    <option value="">Pilih Kejuruan</option>
                    {master?.kejuruan.map((k) => (
                      <option key={k.id} value={k.kejuruan_kode} className="bg-[#000B18]">{k.kejuruan_kode}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Email Gmail</label>
                <input
                  required
                  type="email"
                  className="w-full px-5 py-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">NISN (Opsional)</label>
                <input
                  type="text"
                  className="w-full px-5 py-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.nisn}
                  onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                />
              </div>
            </div>

            <button
              disabled={submitting}
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kirim Pendaftaran'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function RegistrationFormPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#000B18]"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>}>
      <RegistrationFormContent />
    </Suspense>
  )
}
