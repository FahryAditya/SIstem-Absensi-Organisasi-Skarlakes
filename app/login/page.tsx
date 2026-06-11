'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { GraduationCap, User, Mail, Lock, Loader2, Eye, EyeOff, Shield, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

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
    <div className="relative min-h-screen bg-[#000B18] flex items-center justify-center p-6 font-sans overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500/20 to-blue-600/5 rounded-3xl mb-6 border border-blue-500/30 shadow-2xl shadow-blue-500/10"
          >
            <GraduationCap className="w-10 h-10 text-blue-400" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white tracking-tight mb-2"
          >
            Sistem Ekstrakurikuler
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-blue-400/80 text-[10px] font-black uppercase tracking-[0.3em]"
          >
            Admin & Administrator Gateway
          </motion.p>
        </div>

        {/* Login Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="relative group"
        >
          {/* Card Border Glow Effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
          
          <div className="relative bg-[#000B18]/60 backdrop-blur-2xl p-8 sm:p-10 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Subtle Inner Glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
            
            <div className="mb-10 relative">
              <h2 className="text-2xl font-bold text-white mb-2">Selamat Datang</h2>
              <p className="text-slate-400 text-sm">Masuk untuk mengelola data organisasi.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
              <div className="space-y-4">
                <div className="form-group">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Nama Lengkap</label>
                  <div className="relative group/input">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
                    <input
                      type="text"
                      value={nama}
                      onChange={e => setNama(e.target.value)}
                      placeholder="Nama lengkap"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 focus:bg-white/[0.08] transition-all duration-300"
                      autoComplete="off"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Alamat Email</label>
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="email@sekolah.sch.id"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 focus:bg-white/[0.08] transition-all duration-300"
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Kata Sandi</label>
                <div className="relative group/input">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 focus:bg-white/[0.08] transition-all duration-300"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={loading} 
                className="relative w-full group/btn overflow-hidden rounded-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-300 group-hover:scale-105" />
                <div className="relative flex items-center justify-center gap-2 py-4 text-[11px] uppercase tracking-[0.2em] font-black text-white">
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                  ) : (
                    <>
                      Masuk Sekarang
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </motion.button>
            </form>

            <div className="mt-10 pt-8 border-t border-white/5 text-center">
              <p className="text-slate-500 text-sm">
                Belum terdaftar?{' '}
                <button 
                  onClick={() => router.push('/registration')}
                  className="text-blue-400 font-bold hover:text-blue-300 transition-colors relative group/reg"
                >
                  Mulai Pendaftaran
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full" />
                </button>
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-10 flex flex-col items-center gap-3"
        >
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
            <Shield className="w-3 h-3 text-blue-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Artemis Secured Gateway</span>
          </div>
          <p className="text-[9px] font-bold text-slate-600 tracking-wider">© 2026 SMK AIRLANGGA BALIKPAPAN</p>
        </motion.div>
      </motion.div>
    </div>
  )
}

