'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { Trophy, Star, CheckCircle2, X, GraduationCap } from 'lucide-react'

interface CeremonyProps {
  onClose: () => void
  graduates: {
    osis: { id: number; nama: string }[]
    mpk: { id: number; nama: string }[]
    programming: { id: number; nama: string }[]
    english: { id: number; nama: string }[]
  }
  yearFrom: string
  yearTo: string
}

export default function CeremonyAnimation({ onClose, graduates, yearFrom, yearTo }: CeremonyProps) {
  const [phase, setPhase] = useState(0)
  
  // Phase 0: Welcome
  // Phase 1: OSIS Purna Tugas
  // Phase 2: MPK Purna Tugas
  // Phase 3: Other Purna Tugas (Programming & English)
  // Phase 4: Class Upgrade Summary
  // Phase 5: Success

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase(prev => {
        if (prev < 5) return prev + 1
        return prev
      })
    }, 4000)
    
    return () => clearInterval(timer)
  }, [])

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1 } },
    exit: { opacity: 0, transition: { duration: 0.5 } }
  }

  const textVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
  }

  const listVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  }

  return (
    <AnimatePresence>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-[9999] bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 flex items-center justify-center p-6"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-8 h-8" />
        </button>

        <div className="max-w-4xl w-full text-center">
          {/* Phase 0: Welcome */}
          {phase === 0 && (
            <motion.div key="welcome" initial="hidden" animate="visible" exit="hidden">
              <motion.div variants={textVariants} className="mb-6">
                <Star className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-pulse" />
                <h1 className="text-4xl md:text-6xl font-black text-white mb-4">SELAMAT DATANG</h1>
                <h2 className="text-2xl md:text-4xl font-bold text-blue-200">TAHUN AJARAN {yearTo}</h2>
              </motion.div>
              <motion.p variants={textVariants} transition={{ delay: 0.5 }} className="text-blue-100/60 text-lg italic">
                Mulai lembaran baru dengan semangat baru ✨
              </motion.p>
            </motion.div>
          )}

          {/* Phase 1: OSIS Purna Tugas */}
          {phase === 1 && (
            <motion.div key="osis" initial="hidden" animate="visible" exit="hidden">
              <motion.div variants={textVariants} className="mb-8">
                <GraduationCap className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white uppercase tracking-widest">PURNA TUGAS OSIS {yearFrom.split('-')[1]}</h2>
                <p className="text-orange-200 mt-2">Terima kasih atas dedikasi luar biasa Anda</p>
              </motion.div>
              
              <motion.div variants={listVariants} className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                {graduates.osis.map(s => (
                  <motion.div key={s.id} variants={itemVariants} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-3 text-white text-sm font-medium">
                    {s.nama}
                  </motion.div>
                ))}
                {graduates.osis.length === 0 && <p className="text-white/40 col-span-full italic">Tidak ada purna tugas</p>}
              </motion.div>
            </motion.div>
          )}

          {/* Phase 2: MPK Purna Tugas */}
          {phase === 2 && (
            <motion.div key="mpk" initial="hidden" animate="visible" exit="hidden">
              <motion.div variants={textVariants} className="mb-8">
                <GraduationCap className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white uppercase tracking-widest">PURNA TUGAS MPK {yearFrom.split('-')[1]}</h2>
                <p className="text-green-200 mt-2">Kebanggaan kami untuk melayani bersama Anda</p>
              </motion.div>
              
              <motion.div variants={listVariants} className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                {graduates.mpk.map(s => (
                  <motion.div key={s.id} variants={itemVariants} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-3 text-white text-sm font-medium">
                    {s.nama}
                  </motion.div>
                ))}
                {graduates.mpk.length === 0 && <p className="text-white/40 col-span-full italic">Tidak ada purna tugas</p>}
              </motion.div>
            </motion.div>
          )}

          {/* Phase 3: Other Purna Tugas */}
          {phase === 3 && (
            <motion.div key="others" initial="hidden" animate="visible" exit="hidden">
              <motion.div variants={textVariants} className="mb-8">
                <Trophy className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white uppercase tracking-widest">PURNA TUGAS ESKUL</h2>
                <p className="text-blue-200 mt-2">Programming & English Club</p>
              </motion.div>
              
              <motion.div variants={listVariants} className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                {[...graduates.programming, ...graduates.english].map(s => (
                  <motion.div key={s.id} variants={itemVariants} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-3 text-white text-sm font-medium">
                    {s.nama}
                  </motion.div>
                ))}
                {graduates.programming.length + graduates.english.length === 0 && <p className="text-white/40 col-span-full italic">Tidak ada purna tugas</p>}
              </motion.div>
            </motion.div>
          )}

          {/* Phase 4: Upgrade Summary */}
          {phase === 4 && (
            <motion.div key="upgrade" initial="hidden" animate="visible" exit="hidden">
              <motion.div variants={textVariants} className="mb-12">
                <CheckCircle2 className="w-20 h-20 text-green-400 mx-auto mb-6" />
                <h2 className="text-4xl font-black text-white mb-2">PROSES SELESAI!</h2>
                <p className="text-green-200 text-xl">Semua siswa telah berhasil naik kelas</p>
              </motion.div>

              <div className="grid grid-cols-2 gap-8 max-w-lg mx-auto">
                <motion.div variants={textVariants} transition={{ delay: 0.3 }} className="bg-white/5 p-6 rounded-2xl border border-white/10">
                  <div className="text-4xl font-black text-white mb-1">X → XI</div>
                  <div className="text-blue-300 text-sm font-bold uppercase tracking-wider">Berhasil</div>
                </motion.div>
                <motion.div variants={textVariants} transition={{ delay: 0.5 }} className="bg-white/5 p-6 rounded-2xl border border-white/10">
                  <div className="text-4xl font-black text-white mb-1">XI → XII</div>
                  <div className="text-green-300 text-sm font-bold uppercase tracking-wider">Berhasil</div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Phase 5: Success Final */}
          {phase === 5 && (
            <motion.div key="final" initial="hidden" animate="visible">
              <motion.div variants={textVariants} className="mb-8">
                <div className="relative inline-block">
                  <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6" />
                  <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1.5, opacity: 0 }} 
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-yellow-400/20 rounded-full"
                  />
                </div>
                <h2 className="text-5xl font-black text-white mb-4">BERHASIL</h2>
                <p className="text-blue-100 text-lg mb-12 max-w-md mx-auto">
                  Seluruh data siswa telah diperbarui untuk Tahun Ajaran {yearTo}.
                </p>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="bg-white text-indigo-900 px-12 py-4 rounded-full font-black text-xl shadow-2xl shadow-white/20 transition-all"
                >
                  SELESAI
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Phase Indicators */}
        <div className="absolute bottom-12 flex gap-3">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div 
              key={i} 
              className={`h-1.5 transition-all duration-500 rounded-full ${i === phase ? 'w-12 bg-white' : i < phase ? 'w-4 bg-white/40' : 'w-4 bg-white/10'}`} 
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
