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
    <div className="min-h-screen bg-[#001F3F] relative overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />
      
      <div className="max-w-4xl w-full relative z-10">
        <div className="text-center mb-12 slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl shadow-xl mb-6 ring-4 ring-white/5">
            <GraduationCap className="w-8 h-8 text-[#1E90FF]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Pendaftaran Anggota</h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto opacity-80">
            Pilih program atau organisasi yang ingin Anda ikuti untuk mengembangkan potensi diri Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {programs.map((prog, i) => (
            <Link 
              key={prog.title} 
              href={prog.href}
              className="group relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20 slide-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${prog.color} text-white shadow-lg`}>
                  {prog.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300 border border-blue-300/30 px-3 py-1 rounded-full bg-blue-500/10">
                  {prog.badge}
                </span>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                {prog.title}
              </h2>
              <p className="text-blue-100/60 text-sm leading-relaxed mb-6">
                {prog.description}
              </p>
              
              <div className="flex items-center text-blue-400 font-bold text-sm">
                Daftar Sekarang
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center slide-up" style={{ animationDelay: '500ms' }}>
          <p className="text-blue-200/40 text-sm mb-4">
            Sudah menjadi anggota? <Link href="/login" className="text-[#1E90FF] hover:underline font-medium">Masuk ke Dashboard</Link>
          </p>
          <div className="flex items-center justify-center gap-2 text-blue-200/20">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-widest">Sistem Pendaftaran Resmi SKARLAKES</span>
          </div>
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
