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
    <div className="min-h-screen bg-[#001F3F] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border border-white/10 relative z-10 slide-up">
        <div className="w-24 h-24 bg-green-500/20 border border-green-500/30 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 hover:rotate-0 transition-transform duration-500">
          <CheckCircle2 className="w-12 h-12 text-green-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Pendaftaran Berhasil!</h1>
        <p className="text-blue-200/60 mb-8 font-medium">Terima kasih telah bergabung.</p>

        <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl text-left space-y-4 mb-8 border border-white/5">
          <div className="relative pl-4 border-l-2 border-blue-500/50">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-1">Nama Lengkap</span>
            <p className="font-bold text-white text-lg leading-tight">{name}</p>
          </div>
          <div className="relative pl-4 border-l-2 border-indigo-500/50">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Program/Organisasi</span>
            <p className="font-bold text-blue-300 text-lg leading-tight">{org}</p>
          </div>
        </div>

        <p className="text-sm text-blue-100/40 mb-10 leading-relaxed px-2">
          {type === 'eskul' 
            ? 'Pendaftaran Anda sedang ditinjau oleh admin. Pengumuman penerimaan akan dikirimkan ke email Gmail Anda.'
            : 'Anda telah terdaftar sebagai calon anggota. Tunggu informasi selanjutnya mengenai proses seleksi melalui email.'}
        </p>

        <button
          onClick={() => router.push('/')}
          className="group w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-white/10"
        >
          <Home className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
          Kembali ke Beranda
        </button>
      </div>

      <style jsx global>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-up {
          animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}

export default function RegistrationSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#001F3F] flex items-center justify-center"><CheckCircle2 className="w-12 h-12 text-green-400 animate-pulse" /></div>}>
      <RegistrationSuccessContent />
    </Suspense>
  )
}
