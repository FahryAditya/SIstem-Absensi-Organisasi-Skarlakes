'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'

interface MasterData {
  kelas: { id: number; kelas_nama: string }[]
  kejuruan: { id: number; kejuruan_kode: string; skill_group: string }[]
}

function RegistrationEskulContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const program = searchParams.get('program') // 'programming' or 'english'
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
        
        const currentOrg = orgsData.find((o: any) => o.tipe === program)
        if (currentOrg) {
          setOrg(currentOrg)
        } else {
          setError('Program ekstrakurikuler tidak valid')
        }
      } catch (err) {
        setError('Gagal memuat data. Silakan coba lagi.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [program])

  const checkEmail = async (email: string) => {
    if (!email.endsWith('@gmail.com')) {
      setEmailAvailable(null)
      return
    }

    setCheckingEmail(true)
    try {
      const res = await fetch(`/api/registration/check-email?email=${email}&type=eskul&orgId=${org?.id}`)
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
      const res = await fetch('/api/registration/eskul', {
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
        router.push(`/registration/success?type=eskul&name=${encodeURIComponent(formData.nama_peserta)}&org=${encodeURIComponent(org?.nama || '')}`)
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error && !org) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Oops!</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button onClick={() => router.push('/')} className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">
            Kembali ke Beranda
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white text-center">
            <h1 className="text-3xl font-bold mb-2">Pendaftaran Eskul</h1>
            <p className="opacity-90">{org?.nama}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Nama Lengkap</label>
              <input
                required
                type="text"
                placeholder="Contoh: Ahmad Rifki Pratama"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.nama_peserta}
                onChange={(e) => setFormData({ ...formData, nama_peserta: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Kelas</label>
                <select
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.kelas}
                  onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                >
                  <option value="">Pilih Kelas</option>
                  {master?.kelas.map((k) => (
                    <option key={k.id} value={k.kelas_nama}>{k.kelas_nama}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Kejuruan</label>
                <select
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.kejuruan}
                  onChange={(e) => setFormData({ ...formData, kejuruan: e.target.value })}
                >
                  <option value="">Pilih Kejuruan</option>
                  <optgroup label="SKARLA">
                    {master?.kejuruan.filter(k => k.skill_group === 'SKARLA').map((k) => (
                      <option key={k.id} value={k.kejuruan_kode}>{k.kejuruan_kode}</option>
                    ))}
                  </optgroup>
                  <optgroup label="SKAKES">
                    {master?.kejuruan.filter(k => k.skill_group === 'SKAKES').map((k) => (
                      <option key={k.id} value={k.kejuruan_kode}>{k.kejuruan_kode}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Email Gmail</label>
              <div className="relative">
                <input
                  required
                  type="email"
                  placeholder="nama@gmail.com"
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                    emailAvailable === true ? 'border-green-500 ring-green-100' : 
                    emailAvailable === false ? 'border-red-500 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                  }`}
                  value={formData.email_gmail}
                  onChange={(e) => setFormData({ ...formData, email_gmail: e.target.value })}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {checkingEmail && <Loader2 className="w-5 h-5 animate-spin text-slate-400" />}
                  {emailAvailable === true && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  {emailAvailable === false && <AlertCircle className="w-5 h-5 text-red-500" />}
                </div>
              </div>
              {emailAvailable === false && (
                <p className="text-xs text-red-500 font-medium">Email sudah terdaftar di program ini</p>
              )}
              <p className="text-xs text-slate-400 mt-1">*Wajib menggunakan email @gmail.com</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">NISN (Opsional)</label>
              <input
                type="text"
                placeholder="10 digit nomor NISN"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.nisn}
                onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
              />
            </div>

            <button
              disabled={submitting || emailAvailable === false || checkingEmail}
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Daftar Sekarang'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function RegistrationEskulPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <RegistrationEskulContent />
    </Suspense>
  )
}
