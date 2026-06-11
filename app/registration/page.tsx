'use client'

import Link from 'next/link'
import { GraduationCap, Code, Languages, Users, Landmark, ArrowRight, ShieldCheck } from 'lucide-react'

export default function RegistrationRootPage() {
  const programs = [
    {
      title: 'OSIS',
      description: 'Organisasi Siswa Intra Sekolah - Menjadi pemimpin masa depan.',
      icon: <Users className="w-8 h-8" />,
      href: '/registration/osis-mpk?org=osis',
      color: 'from-blue-600 to-indigo-700',
      badge: 'Organisasi'
    },
    {
      title: 'MPK',
      description: 'Majelis Perwakilan Kelas - Suarakan aspirasi teman sekelasmu.',
      icon: <Landmark className="w-8 h-8" />,
      href: '/registration/osis-mpk?org=mpk',
      color: 'from-indigo-600 to-purple-700',
      badge: 'Organisasi'
    },
    {
      title: 'Programming',
      description: 'Asah kemampuan coding dan bangun aplikasi impianmu.',
      icon: <Code className="w-8 h-8" />,
      href: '/registration/eskul?program=programming',
      color: 'from-cyan-500 to-blue-600',
      badge: 'Ekstrakurikuler'
    },
    {
      title: 'English Club',
      description: 'Improve your speaking skills and master English.',
      icon: <Languages className="w-8 h-8" />,
      href: '/registration/eskul?program=english',
      color: 'from-blue-400 to-cyan-500',
      badge: 'Ekstrakurikuler'
    }
  ]

  return (
    <div className="min-h-screen bg-[#000B18] relative overflow-hidden flex flex-col items-center justify-center p-6 font-sans">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse delay-700" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
      </div>
      
      <div className="max-w-5xl w-full relative z-10">
        <header className="text-center mb-16 slide-up">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 ring-1 ring-white/10">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">Penerimaan Anggota Baru 2026</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-tight">
            Mulai <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Petualanganmu</span> <br className="hidden md:block" /> di SKARLAKES
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Temukan tempat terbaik untuk mengasah bakat, membangun kepemimpinan, dan menciptakan kenangan tak terlupakan.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {programs.map((prog, i) => (
            <Link 
              key={prog.title} 
              href={prog.href}
              className="group relative flex flex-col bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 hover:bg-white/[0.06] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] slide-up overflow-hidden"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              {/* Decorative gradient overlay */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${prog.color} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500`} />
              
              <div className="flex justify-between items-start mb-10 relative z-10">
                <div className={`p-5 rounded-[1.5rem] bg-gradient-to-br ${prog.color} text-white shadow-2xl shadow-blue-900/40 group-hover:scale-110 transition-transform duration-500`}>
                  {prog.icon}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/80">
                    {prog.badge}
                  </span>
                  <div className="h-px w-8 bg-white/10" />
                </div>
              </div>
              
              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-blue-300 transition-all">
                  {prog.title}
                </h2>
                <p className="text-slate-400 text-base leading-relaxed mb-10 group-hover:text-slate-300 transition-colors">
                  {prog.description}
                </p>
                
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center text-white font-bold text-sm tracking-wide">
                    Gabung Sekarang
                    <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-3 transition-transform duration-500 text-blue-500" />
                  </div>
                  <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-500">
                    <ArrowRight className="w-5 h-5 -rotate-45" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <footer className="mt-20 text-center slide-up" style={{ animationDelay: '800ms' }}>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent mx-auto mb-10" />
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
            <Link href="/login" className="text-slate-500 hover:text-blue-400 transition-colors text-sm font-medium flex items-center gap-2 group">
              Sudah punya akun? <span className="text-white group-hover:underline">Masuk ke Dashboard</span>
            </Link>
            
            <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/10" />
            
            <div className="flex items-center gap-3 text-white/20">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">SKARLAKES Official System</span>
            </div>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-up {
          animation: slide-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}
