'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, Home } from 'lucide-react'

function RegistrationSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const name = searchParams.get('name')
  const org = searchParams.get('org')
  const type = searchParams.get('type')

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full text-center border border-slate-100">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Pendaftaran Berhasil!</h1>
        <p className="text-slate-600 mb-8">Terima kasih telah mendaftar.</p>

        <div className="bg-slate-50 p-6 rounded-2xl text-left space-y-3 mb-8 border border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap</span>
            <p className="font-bold text-slate-700">{name}</p>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Program/Organisasi</span>
            <p className="font-bold text-blue-600">{org}</p>
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          {type === 'eskul' 
            ? 'Pendaftaran Anda sedang ditinjau oleh admin. Pengumuman penerimaan akan dikirimkan ke email Gmail Anda.'
            : 'Anda telah terdaftar sebagai calon anggota. Tunggu informasi selanjutnya mengenai proses seleksi melalui email.'}
        </p>

        <button
          onClick={() => router.push('/')}
          className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors"
        >
          <Home className="w-5 h-5" />
          Kembali ke Beranda
        </button>
      </div>
    </div>
  )
}

export default function RegistrationSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><CheckCircle2 className="w-12 h-12 text-green-600 animate-pulse" /></div>}>
      <RegistrationSuccessContent />
    </Suspense>
  )
}
