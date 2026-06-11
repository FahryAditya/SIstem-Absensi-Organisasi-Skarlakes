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
    <div className="min-h-screen bg-[#000B18] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="bg-white/[0.03] backdrop-blur-3xl p-12 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] max-w-md w-full text-center border border-white/10 relative z-10 slide-up">
        <div className="w-28 h-24 bg-green-500/10 border border-green-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-10 rotate-3 hover:rotate-0 transition-all duration-500 group shadow-2xl shadow-green-900/20">
          <CheckCircle2 className="w-12 h-12 text-green-400 group-hover:scale-110 transition-transform" />
        </div>
        
        <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Pendaftaran Berhasil!</h1>
        <p className="text-slate-400 mb-10 font-medium text-sm tracking-wide">Selamat bergabung di keluarga besar SKARLAKES.</p>

        <div className="bg-white/[0.02] backdrop-blur-md p-8 rounded-[2rem] text-left space-y-6 mb-10 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full" />
          
          <div className="relative z-10">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.25em] block mb-2">Nama Lengkap</span>
            <p className="font-bold text-white text-xl leading-tight">{name}</p>
          </div>
          
          <div className="h-px w-full bg-white/5" />
          
          <div className="relative z-10">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em] block mb-2">Program / Organisasi</span>
            <p className="font-bold text-blue-100 text-xl leading-tight">{org}</p>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-12 leading-relaxed px-4 font-medium italic">
          {type === 'eskul' 
            ? 'Pendaftaran Anda sedang ditinjau. Pengumuman penerimaan akan dikirimkan melalui email Gmail resmi Anda.'
            : 'Data Anda telah tersimpan. Silakan tunggu informasi jadwal seleksi lanjutan yang akan dikirimkan via email.'}
        </p>

        <button
          onClick={() => router.push('/')}
          className="group w-full py-5 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-white/10"
        >
          <Home className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          Kembali ke Beranda
        </button>
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
