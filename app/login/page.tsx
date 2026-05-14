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
    { label: 'Programming', color: 'bg-[#C2E8FF] text-[#052659]' },
    { label: 'English Club', color: 'bg-white/90 text-[#052659]' },
    { label: 'OSIS', color: 'bg-[rgba(126,160,197,0.25)] text-white border border-white/20' },
    { label: 'MPK', color: 'bg-[rgba(84,130,180,0.35)] text-white border border-white/20' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#052659] via-[#011025] to-[#5482B4] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
      </div>

      <div className="w-full max-w-md relative slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#052659] rounded-2xl shadow-xl shadow-[#011025]/50 mb-4 ring-4 ring-[#5482B4]/20">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Sistem Ekstrakurikuler Sekolah</h1>
          <p className="text-[#C2E8FF] text-sm mt-1.5 font-medium">Sistem Manajemen Ekstrakurikuler</p>
          <div className="flex items-center justify-center gap-2 flex-wrap mt-3">
            {orgBadges.map(b => (
              <span key={b.label} className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${b.color}`}>
                {b.label}
              </span>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Masuk ke Dashboard</h2>
            <p className="text-[#C2E8FF] text-sm mt-1">Masukkan identitas lengkap Anda</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
            {/* Nama */}
            <div>
              <label className="block text-xs font-bold text-[#C2E8FF] uppercase tracking-widest mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7EA0C5]" />
                <input
                  type="text"
                  value={nama}
                  onChange={e => setNama(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-[#7EA0C5]/70 focus:outline-none focus:ring-2 focus:ring-[#5482B4] focus:border-transparent transition-all text-sm"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-[#C2E8FF] uppercase tracking-widest mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7EA0C5]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@domain.com"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-[#7EA0C5]/70 focus:outline-none focus:ring-2 focus:ring-[#5482B4] focus:border-transparent transition-all text-sm"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-[#C2E8FF] uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7EA0C5]" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-[#7EA0C5]/70 focus:outline-none focus:ring-2 focus:ring-[#5482B4] focus:border-transparent transition-all text-sm"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7EA0C5] hover:text-white transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-[#052659] hover:bg-[#011025] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#011025]/40 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</> : 'Masuk'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-white/10 flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-[#7EA0C5] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#C2E8FF]/80">
              Hak akses dibatasi sesuai peran. Hubungi Administrator jika belum memiliki akun.
            </p>
          </div>
        </div>

        <p className="text-center text-[#C2E8FF]/60 text-xs mt-6">
          SMK AIRLANGGA BALIKPAPAN • Sistem Ekstrakurikuler Sekolah
        </p>
      </div>
    </div>
  )
}
