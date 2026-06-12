'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { GraduationCap, Users, ArrowRight, ShieldCheck, Loader2, Building2 } from 'lucide-react'

export default function RegistrationRootPage() {
  const [orgs, setOrgs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/organizations')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setOrgs(json.data)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#000B18] relative overflow-hidden flex flex-col items-center justify-center p-6 font-sans">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>
      
      <div className="max-w-5xl w-full relative z-10">
        <header className="text-center mb-16 slide-up">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 ring-1 ring-white/10">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">Penerimaan Anggota Baru 2026</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-tight">
            Mulai <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Petualanganmu</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Pilih organisasi atau ekstrakurikuler yang ingin Anda ikuti.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orgs.map((org, i) => (
              <Link 
                key={org.id} 
                href={`/registration/form?orgId=${org.id}`}
                className="group relative flex flex-col bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 hover:bg-white/[0.06] transition-all duration-500 hover:-translate-y-1 slide-up overflow-hidden"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 rounded-2xl bg-blue-600/20 text-blue-400 group-hover:scale-110 transition-transform">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    {org.category}
                  </span>
                </div>
                
                <h2 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  {org.nama}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-2">
                  {org.deskripsi || `Gabung bersama tim ${org.nama} untuk mengasah bakat dan kemampuanmu.`}
                </p>
                
                <div className="mt-auto flex items-center text-white font-bold text-xs">
                  Daftar Sekarang
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform text-blue-500" />
                </div>
              </Link>
            ))}
          </div>
        )}

        <footer className="mt-20 text-center slide-up" style={{ animationDelay: '800ms' }}>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
            <Link href="/login" className="text-slate-500 hover:text-blue-400 transition-colors text-sm font-medium">
              Sudah punya akun? <span className="text-white">Masuk ke Dashboard</span>
            </Link>
            <div className="flex items-center gap-3 text-white/20">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">SKARLAKES Official System</span>
            </div>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-up {
          animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}
