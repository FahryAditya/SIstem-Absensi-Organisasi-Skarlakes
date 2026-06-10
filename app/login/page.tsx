'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { GraduationCap, User, Mail, Lock, Loader2, Eye, EyeOff, Shield } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('last_login')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setNama(parsed.nama || '')
        setEmail(parsed.email || '')
        setPassword(parsed.password || '')
      } catch (e) {}
    }
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!nama.trim() || !email.trim() || !password.trim()) {
      toast.error('Semua field wajib diisi')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: nama.trim(), email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Login gagal')
        setLoading(false)
        return
      }
      if (data.user.role !== 'administrator') {
        localStorage.setItem('last_login', JSON.stringify({ nama: nama.trim(), email: email.trim(), password }))
      } else {
        localStorage.removeItem('last_login')
      }
      
      toast.success(`Selamat datang, ${data.user.nama}! 👋`, { duration: 4000 })
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan koneksi')
      setLoading(false)
    }
  }

  const orgBadges = [
    { label: 'Programming', color: 'bg-[#1E90FF] text-[#001F3F]' },
    { label: 'English Club', color: 'bg-white/90 text-[#001F3F]' },
    { label: 'OSIS', color: 'bg-[rgba(126,160,197,0.25)] text-white border border-white/20' },
    { label: 'MPK', color: 'bg-[rgba(84,130,180,0.35)] text-white border border-white/20' },
  ]

  return (
    <div className="min-h-screen bg-[#000B18] relative overflow-hidden flex flex-col items-center justify-center p-6 font-sans">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-lg relative z-10 slide-up">
        {/* Logo & Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/[0.03] backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/10 mb-6 ring-1 ring-white/10 group hover:scale-110 transition-transform duration-500">
            <GraduationCap className="w-10 h-10 text-blue-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">Artemis Series</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.3em]">Sistem Manajemen Kesiswaan</p>
          
          <div className="flex items-center justify-center gap-2 flex-wrap mt-6">
            {orgBadges.map(b => (
              <span key={b.label} className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/5 bg-white/5 text-slate-400`}>
                {b.label}
              </span>
            ))}
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">Selamat Datang</h2>
            <p className="text-slate-400 font-medium">Silakan masuk untuk melanjutkan ke dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Identitas Pengguna</label>
              <div className="space-y-4">
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={nama}
                    onChange={e => setNama(e.target.value)}
                    placeholder="Nama Lengkap"
                    className="w-full pl-12 pr-5 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    autoComplete="off"
                  />
                </div>
                
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Alamat Email"
                    className="w-full pl-12 pr-5 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Kata Sandi</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-14 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-blue-900/40 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-3">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</> : 'Masuk Sekarang'}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-500 text-sm font-medium">
              Belum terdaftar?{' '}
              <button 
                onClick={() => router.push('/registration')}
                className="text-white font-bold hover:underline decoration-blue-500 decoration-2 underline-offset-4"
              >
                Mulai Pendaftaran
              </button>
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 text-slate-600">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Secure Artemis Gateway</span>
          </div>
          <p className="text-[10px] font-medium opacity-50">© 2026 SMK AIRLANGGA • ALL RIGHTS RESERVED</p>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-up { animation: slide-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  )
}
