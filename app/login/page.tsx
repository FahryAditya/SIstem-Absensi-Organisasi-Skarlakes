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

  return (
    <div className="min-h-screen bg-[#000B18] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/10 rounded-2xl mb-4 border border-blue-500/20">
            <GraduationCap className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sistem Ekstrakurikuler</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Admin & Administrator Gateway</p>
        </div>

        {/* Login Card */}
        <div className="card p-8 sm:p-10 border border-white/10 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-1">Selamat Datang</h2>
            <p className="text-slate-400 text-sm">Masuk untuk mengelola data organisasi.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">
            <div className="space-y-4">
              <div className="form-group">
                <label className="label">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={nama}
                    onChange={e => setNama(e.target.value)}
                    placeholder="Nama lengkap"
                    className="input pl-10"
                    autoComplete="off"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="label">Alamat Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@sekolah.sch.id"
                    className="input pl-10"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Kata Sandi</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10 pr-12"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 justify-center text-xs uppercase tracking-widest font-bold">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</> : 'Masuk Sekarang'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-500 text-sm">
              Belum terdaftar?{' '}
              <button 
                onClick={() => router.push('/registration')}
                className="text-blue-400 font-bold hover:text-blue-300 transition-colors"
              >
                Mulai Pendaftaran
              </button>
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 text-slate-600">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Artemis Secured</span>
          </div>
          <p className="text-[10px] font-medium opacity-50">© 2026 SMK AIRLANGGA BALIKPAPAN</p>
        </div>
      </div>
    </div>
  )
}

