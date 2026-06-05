'use client'

import { useState, useEffect, useMemo } from 'react'
import { getAccessibleOrgs } from '@/lib/auth-shared'
import { 
  Building2, Users, ScrollText, Search, ArrowRight, ArrowLeft, 
  Download, Loader2, CheckCircle2, ChevronRight, Sparkles, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Member {
  id: number
  nama: string
  nis: string | null
  kelas: string | null
  jabatan?: string | null
  ekskul?: string
  org?: string
}

interface Props {
  user: { id: number; nama: string; email: string; role: string }
}

const ORG_LABELS: Record<string, string> = {
  osis: 'OSIS (Organisasi Siswa Intra Sekolah)',
  mpk: 'MPK (Majelis Perwakilan Kelas)',
  programming: 'Ekskul Programming',
  english: 'Ekskul English Club',
}

const ORG_THEMES: Record<string, { border: string; bg: string; text: string; ring: string; badge: string; iconBg: string }> = {
  osis: {
    border: 'border-unit-osis/30 hover:border-unit-osis',
    bg: 'bg-unit-osis/5',
    text: 'text-unit-osis',
    ring: 'focus:ring-unit-osis',
    badge: 'bg-unit-osis/10 text-unit-osis border-unit-osis/20',
    iconBg: 'bg-unit-osis text-white',
  },
  mpk: {
    border: 'border-unit-mpk/30 hover:border-unit-mpk',
    bg: 'bg-unit-mpk/5',
    text: 'text-unit-mpk',
    ring: 'focus:ring-unit-mpk',
    badge: 'bg-unit-mpk/10 text-unit-mpk border-unit-mpk/20',
    iconBg: 'bg-unit-mpk text-white',
  },
  english: {
    border: 'border-unit-english/30 hover:border-unit-english',
    bg: 'bg-unit-english/5',
    text: 'text-unit-english',
    ring: 'focus:ring-unit-english',
    badge: 'bg-unit-english/10 text-unit-english border-unit-english/20',
    iconBg: 'bg-unit-english text-white',
  },
  programming: {
    border: 'border-unit-programming/30 hover:border-unit-programming',
    bg: 'bg-unit-programming/5',
    text: 'text-unit-programming',
    ring: 'focus:ring-unit-programming',
    badge: 'bg-unit-programming/10 text-unit-programming border-unit-programming/20',
    iconBg: 'bg-unit-programming text-white',
  },
}

const PREDEFINED_ACTIVITIES = [
  'Rapat',
  'Jumat Seni',
  'Jumat Religius',
  'Jumat Pramuka',
]

export default function AmbilSiswaClient({ user }: Props) {
  const [step, setStep] = useState<number>(1)
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([])
  const [judulKegiatan, setJudulKegiatan] = useState<string>('')
  const [isOpen, setIsOpen] = useState<boolean>(false)
  
  // Student selection state
  const [students, setStudents] = useState<Member[]>([])
  const [loadingStudents, setLoadingStudents] = useState<boolean>(false)
  const [selectedSiswaKeys, setSelectedSiswaKeys] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [downloading, setDownloading] = useState<boolean>(false)

  // Get accessible organizations based on role
  const accessibleOrgs = useMemo(() => getAccessibleOrgs(user.role), [user.role])

  // Automatically select first organization if only one is accessible
  useEffect(() => {
    if (accessibleOrgs.length === 1 && selectedOrgs.length === 0) {
      setSelectedOrgs([accessibleOrgs[0]])
    }
  }, [accessibleOrgs, selectedOrgs])

  // Fetch students when organizations change
  useEffect(() => {
    if (selectedOrgs.length === 0) {
      setStudents([])
      setSelectedSiswaKeys([])
      return
    }

    async function loadStudents() {
      setLoadingStudents(true)
      try {
        const orgsToLoad = selectedOrgs.filter((org) => accessibleOrgs.includes(org))
        const fetchPromises = orgsToLoad.map(async (org) => {
          let res
          if (org === 'osis' || org === 'mpk') {
            res = await fetch(`/api/organisasi?tipe=${org}&limit=1000`)
          } else {
            res = await fetch(`/api/siswa?ekskul=${org}&limit=1000`)
          }
          
          const json = await res.json()
          if (!res.ok) throw new Error(json.error || `Gagal memuat data ${org.toUpperCase()}`)
          
          const list: Member[] = json.data || []
          // Decorate members with their source organization
          return list.map((m) => ({ ...m, org }))
        })

        const settledResults = await Promise.allSettled(fetchPromises)
        const failedOrgs: string[] = []
        const combined = settledResults.flatMap((result, idx) => {
          if (result.status === 'fulfilled') return result.value
          failedOrgs.push(orgsToLoad[idx])
          return []
        })
        
        // Sort combined list alphabetically by name
        combined.sort((a, b) => a.nama.localeCompare(b.nama))
        
        setStudents(combined)
        // Reset selected state and select all by default using the unique compound key org-id
        setSelectedSiswaKeys(combined.map(s => `${s.org}-${s.id}`))

        if (failedOrgs.length > 0) {
          toast.error(`Sebagian data gagal dimuat: ${failedOrgs.join(', ').toUpperCase()}`)
        }
      } catch (err: any) {
        toast.error(err.message || 'Gagal memuat data siswa')
      } finally {
        setLoadingStudents(false)
      }
    }

    loadStudents()
  }, [selectedOrgs, accessibleOrgs])

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return students
    return students.filter(s => 
      s.nama.toLowerCase().includes(query) || 
      (s.kelas && s.kelas.toLowerCase().includes(query)) ||
      (s.nis && s.nis.includes(query))
    )
  }, [students, searchQuery])

  // Toggle single checkbox selection using unique compound key
  const handleToggleSiswa = (key: string) => {
    setSelectedSiswaKeys(prev => 
      prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key]
    )
  }

  // Toggle select all filtered students
  const handleToggleSelectAll = () => {
    const filteredKeys = filteredStudents.map(s => `${s.org}-${s.id}`)
    const allSelected = filteredKeys.every(k => selectedSiswaKeys.includes(k))

    if (allSelected) {
      // Deselect all filtered
      setSelectedSiswaKeys(prev => prev.filter(k => !filteredKeys.includes(k)))
    } else {
      // Select all filtered (keeping previously selected ones outside of filter)
      setSelectedSiswaKeys(prev => {
        const unique = new Set([...prev, ...filteredKeys])
        return Array.from(unique)
      })
    }
  }

  // Check if all filtered students are selected
  const isAllFilteredSelected = useMemo(() => {
    if (filteredStudents.length === 0) return false
    return filteredStudents.map(s => `${s.org}-${s.id}`).every(k => selectedSiswaKeys.includes(k))
  }, [filteredStudents, selectedSiswaKeys])

  // Handle organization selector grid click (supports multiple selection)
  const handleToggleOrg = (orgKey: string) => {
    setSelectedOrgs(prev =>
      prev.includes(orgKey)
        ? prev.filter(o => o !== orgKey)
        : [...prev, orgKey]
    )
  }

  // Handle step progression
  const handleNextStep = () => {
    if (selectedOrgs.length === 0) {
      toast.error('Silakan pilih minimal satu unit/organisasi terlebih dahulu')
      return
    }
    if (!judulKegiatan.trim()) {
      toast.error('Silakan isi judul kegiatan terlebih dahulu')
      return
    }
    setStep(2)
  }

  // Handle Excel download submit
  const handleCetakExcel = async () => {
    if (selectedSiswaKeys.length === 0) {
      toast.error('Pilih minimal satu siswa/anggota untuk dicetak')
      return
    }

    setDownloading(true)
    const t = toast.loading('Sedang merancang file Excel lembar kehadiran...')

    try {
      const siswaSelections = selectedSiswaKeys.map(key => {
        const [org, idStr] = key.split('-')
        return { org, id: parseInt(idStr) }
      })

      const res = await fetch('/api/ambil-siswa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgs: selectedOrgs,
          judulKegiatan: judulKegiatan.trim(),
          siswaSelections,
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Gagal mengekspor file Excel')
      }

      // Download file blob
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const orgNames = selectedOrgs.join('_')
      a.download = `daftar_hadir_${orgNames}_${judulKegiatan.toLowerCase().replace(/\s+/g, '_')}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('File Excel Lembar Kehadiran berhasil diunduh!', { id: t })
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat mengunduh Excel', { id: t })
    } finally {
      setDownloading(false)
    }
  }

  // Combined theme used when multiple organizations are chosen
  const COMBINED_THEME = {
    border: 'border-persian-blue/20 hover:border-persian-blue/40',
    bg: 'bg-persian-blue/5',
    text: 'text-persian-blue',
    ring: 'focus:ring-persian-blue',
    badge: 'bg-persian-blue/10 text-persian-blue border-persian-blue/20',
    iconBg: 'bg-persian-blue text-white',
  }

  const activeTheme = useMemo(() => {
    if (selectedOrgs.length === 0) return null
    if (selectedOrgs.length === 1) return ORG_THEMES[selectedOrgs[0]]
    return COMBINED_THEME
  }, [selectedOrgs])

  const orgDisplayText = useMemo(() => {
    return selectedOrgs.map(o => o.toUpperCase()).join(' & ')
  }, [selectedOrgs])

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Dynamic Header */}
      <div className="page-header bg-deep-navy border border-white/10 p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-persian-blue animate-pulse" />
            <h2 className="page-title text-white font-extrabold tracking-tight">Ambil Anggota / Siswa Kegiatan</h2>
          </div>
          <p className="page-sub text-slate-400 text-xs font-semibold mt-1">Cetak lembar daftar hadir kegiatan ekskul atau organisasi sekolah secara instan.</p>
        </div>

        {/* Wizard Steps Indicator */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
            step === 1 
              ? 'bg-persian-blue/10 border-persian-blue/30 text-white' 
              : 'bg-green-500/10 border-green-500/20 text-green-400'
          }`}>
            <span className="w-4 h-4 rounded-full bg-current text-white flex items-center justify-center text-[10px]">1</span>
            Informasi
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-40 text-slate-400" />
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
            step === 2 
              ? 'bg-persian-blue/10 border-persian-blue/30 text-white' 
              : 'bg-white/5 border-white/10 text-slate-400'
          }`}>
            <span className="w-4 h-4 rounded-full bg-current text-white flex items-center justify-center text-[10px]">2</span>
            Pilih Siswa
          </div>
        </div>
      </div>

      {/* Step 1: Info Form */}
      {step === 1 && (
        <div className="card p-6 bg-deep-navy border border-white/10 rounded-2xl shadow-sm space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-persian-blue" /> Langkah 1: Keterangan & Tujuan Kegiatan
            </h3>
            <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">Silakan isi detail dasar kegiatan Anda di bawah.</p>
          </div>

          {/* Org Selector Grid */}
          <div className="space-y-3">
            <label className="label text-[#001F3F] font-bold">Pilih Organisasi / Ekskul Kegiatan * <span className="text-xs font-semibold text-slate-400 font-normal">(bisa pilih 2 atau lebih sekaligus)</span></label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {accessibleOrgs.map((orgKey) => {
                const theme = ORG_THEMES[orgKey]
                const isSelected = selectedOrgs.includes(orgKey)
                const Icon = orgKey === 'osis' || orgKey === 'mpk' ? Building2 : Users
                
                return (
                  <button
                    key={orgKey}
                    type="button"
                    onClick={() => handleToggleOrg(orgKey)}
                    className={`p-4 rounded-xl border-2 text-left flex items-start gap-4 transition-all duration-200 ${
                      isSelected 
                        ? `${theme.border} ${theme.bg} ring-2 ring-offset-1 ${theme.text}` 
                        : 'border-white/10 hover:border-white/10 bg-deep-navy hover:bg-white/5/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative ${
                      isSelected ? theme.iconBg : 'bg-white/5 text-slate-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 bg-green-500 text-white rounded-full p-0.5 border border-white">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-extrabold truncate text-white">{orgKey.toUpperCase()}</div>
                      <div className="text-xs font-semibold text-slate-400 mt-0.5 truncate">{ORG_LABELS[orgKey]}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom Modern Dropdown & Custom Title Input */}
          <div className="form-group space-y-3">
            <label className="label text-[#001F3F] font-bold">Judul / Acara Kegiatan *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Custom Dropdown Container */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className={`w-full flex items-center justify-between input pl-10 pr-4 py-2.5 bg-deep-navy border border-white/10 rounded-xl text-sm font-semibold transition-all duration-200 text-left select-none cursor-pointer ${
                    isOpen 
                      ? 'border-persian-blue/100 ring-2 ring-persian-blue/100/20' 
                      : 'hover:border-slate-300'
                  }`}
                >
                  <ScrollText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <span className={judulKegiatan ? 'text-white' : 'text-slate-400'}>
                    {PREDEFINED_ACTIVITIES.includes(judulKegiatan) 
                      ? judulKegiatan 
                      : (judulKegiatan ? 'Lainnya (Ketik Manual...)' : 'Pilih Judul Kegiatan...')}
                  </span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    isOpen ? 'rotate-90 text-persian-blue/100' : ''
                  }`} />
                </button>

                {/* Dropdown Options Box with Premium Glassmorphism & Shadow */}
                {isOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsOpen(false)} 
                    />
                    <div className="absolute left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden py-1.5 animate-fadeIn max-h-60 overflow-y-auto">
                      <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Kegiatan Sekolah Default
                      </div>
                      {PREDEFINED_ACTIVITIES.map((act) => {
                        const isChosen = judulKegiatan === act
                        return (
                          <button
                            key={act}
                            type="button"
                            onClick={() => {
                              setJudulKegiatan(act)
                              setIsOpen(false)
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-all duration-150 flex items-center justify-between cursor-pointer ${
                              isChosen 
                                ? 'bg-persian-blue/10 text-persian-blue' 
                                : 'text-slate-300 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <span>{act}</span>
                            {isChosen && <CheckCircle2 className="w-3.5 h-3.5 text-persian-blue/100" />}
                          </button>
                        )
                      })}
                      <div className="border-t border-white/10 my-1" />
                      <button
                        type="button"
                        onClick={() => {
                          setJudulKegiatan('')
                          setIsOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-black transition-all duration-150 flex items-center justify-between cursor-pointer ${
                          !PREDEFINED_ACTIVITIES.includes(judulKegiatan) && judulKegiatan !== ''
                            ? 'bg-persian-blue/10 text-persian-blue' 
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span>Lainnya (Ketik Manual...)</span>
                        {!PREDEFINED_ACTIVITIES.includes(judulKegiatan) && judulKegiatan !== '' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-persian-blue/100" />
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Show input field if "Lainnya" is selected or if a custom value is input */}
              {(!PREDEFINED_ACTIVITIES.includes(judulKegiatan) || judulKegiatan === '') && (
                <div className="relative animate-fadeIn space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400">Judul Kegiatan Kustom</span>
                    {judulKegiatan.length > 0 && (
                      <span className={`text-[10px] font-bold ${judulKegiatan.length >= 100 ? 'text-red-500' : 'text-slate-400'}`}>
                        {judulKegiatan.length}/100
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={judulKegiatan}
                    onChange={(e) => setJudulKegiatan(e.target.value)}
                    placeholder="Ketik judul kegiatan kustom Anda di sini..."
                    maxLength={100}
                    className={`input focus:ring-2 focus:ring-offset-1 transition-all ${
                      judulKegiatan.length >= 100 ? 'border-red-400 focus:ring-red-500/20' : (activeTheme ? activeTheme.ring : 'focus:ring-persian-blue/100')
                    }`}
                  />
                  {judulKegiatan.length >= 100 && (
                    <p className="text-[10px] text-red-500 font-bold mt-1">Batas maksimal judul kegiatan adalah 100 karakter!</p>
                  )}
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-semibold">Pilih salah satu kegiatan default atau pilih "Lainnya" untuk menulis nama kegiatan kustom secara bebas.</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleNextStep}
              disabled={selectedOrgs.length === 0 || !judulKegiatan.trim()}
              className={`btn-primary flex items-center gap-2 shadow-sm font-bold transition-all px-6 py-2.5 rounded-xl ${
                (selectedOrgs.length === 0 || !judulKegiatan.trim()) 
                  ? 'opacity-50 cursor-not-allowed bg-slate-300 border-slate-300 text-slate-400' 
                  : activeTheme ? `${activeTheme.iconBg} border-transparent text-white hover:opacity-90` : 'btn-primary'
              }`}
            >
              Lanjut ke Pilih Anggota <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Student List Checkbox */}
      {step === 2 && activeTheme && (
        <div className="card p-6 bg-deep-navy border border-white/10 rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 gap-4 flex-wrap">
            <div>
              <h3 className="text-sm font-black text-[#001F3F] flex items-center gap-2">
                <Users className="w-4 h-4 text-persian-blue/100" /> Langkah 2: Pilih Siswa / Anggota
              </h3>
              <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">Silakan pilih/centang siswa yang hadir dalam kegiatan ini.</p>
            </div>
            {/* Quick Context Card */}
            <div className={`p-2.5 rounded-xl border flex items-center gap-3 text-xs ${activeTheme.bg} ${activeTheme.border}`}>
              <div>
                <span className="font-extrabold text-white">{orgDisplayText}</span>
                <span className="mx-1 text-slate-300">•</span>
                <span className="font-semibold text-slate-400 truncate max-w-[200px] inline-block align-bottom">{judulKegiatan}</span>
              </div>
            </div>
          </div>

          {/* Search bar + select all indicator */}
          <div className="flex items-center justify-between gap-3 flex-wrap bg-white/5 p-3 rounded-xl border border-white/10">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan nama atau kelas..."
                maxLength={50}
                className="input pl-9 pr-4 py-1.5 text-sm bg-deep-navy"
              />
            </div>
            
            {/* selection stats */}
            <div className="flex items-center gap-3">
              <span className={`badge border text-xs font-bold ${activeTheme.badge}`}>
                Terpilih: {selectedSiswaKeys.length} / {students.length} Anggota
              </span>
              <button 
                onClick={handleToggleSelectAll} 
                className="text-xs font-extrabold text-persian-blue hover:text-blue-300 transition-colors"
              >
                {isAllFilteredSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          {/* Dynamic Checklist table */}
          {loadingStudents ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-persian-blue/100" />
              <span className="text-sm font-semibold">Menghubungkan & Memuat Anggota...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-16 text-center border-2 border-dashed border-white/10 rounded-xl space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-400">Tidak ada anggota yang cocok dengan kata kunci pencarian.</p>
              <button 
                onClick={() => setSearchQuery('')} 
                className="text-xs font-extrabold text-persian-blue hover:underline"
              >
                Reset Pencarian
              </button>
            </div>
          ) : (
            <div className="border border-white/10 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="th py-3 px-4 w-12 text-center">
                        <input
                           type="checkbox"
                           checked={isAllFilteredSelected}
                           onChange={handleToggleSelectAll}
                           className="rounded border-slate-300 text-persian-blue focus:ring-persian-blue/100 cursor-pointer"
                        />
                      </th>
                      <th className="th py-3 px-2 w-10 text-center text-slate-400">No</th>
                      <th className="th py-3 px-3">Nama Lengkap</th>
                      <th className="th py-3 px-3 w-32">Kelas</th>
                      <th className="th py-3 px-3 w-44">NIS</th>
                      <th className="th py-3 px-3 w-48">Asal Unit / Organisasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((siswa, idx) => {
                      const key = `${siswa.org}-${siswa.id}`
                      const isSelected = selectedSiswaKeys.includes(key)
                      const itemNo = idx + 1
                      return (
                        <tr 
                          key={key} 
                          onClick={() => handleToggleSiswa(key)}
                          className={`hover:bg-white/5/50 cursor-pointer transition-colors ${
                            isSelected ? (
                              siswa.org === 'osis' ? 'bg-[#3D3DB8]/5' :
                              siswa.org === 'mpk' ? 'bg-[#DC143C]/5' :
                              siswa.org === 'english' ? 'bg-[#0F52BA]/5' :
                              'bg-[#FFB81C]/5'
                            ) : ''
                          }`}
                        >
                          <td className="td py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSiswa(key)}
                              className="rounded border-slate-300 text-persian-blue focus:ring-persian-blue/100 cursor-pointer"
                            />
                          </td>
                          <td className="td py-3 px-2 text-center text-slate-400 font-mono text-xs">{itemNo}</td>
                          <td className="td py-3 px-3 font-semibold text-white text-sm">{siswa.nama}</td>
                          <td className="td py-3 px-3 text-xs text-slate-400 font-medium">{siswa.kelas || '-'}</td>
                          <td className="td py-3 px-3 text-xs text-slate-400 font-mono">{siswa.nis || '-'}</td>
                          <td className="td py-3 px-3 text-xs text-slate-300 font-medium">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold uppercase ${
                              siswa.org === 'osis' ? 'bg-[#3D3DB8]/10 text-[#3D3DB8] border-[#3D3DB8]/20' :
                              siswa.org === 'mpk' ? 'bg-[#DC143C]/10 text-[#DC143C] border-[#DC143C]/20' :
                              siswa.org === 'english' ? 'bg-[#0F52BA]/10 text-[#0F52BA] border-[#0F52BA]/20' :
                              'bg-[#FFB81C]/10 text-[#FFB81C] border-[#FFB81C]/20'
                            }`}>
                              {siswa.org?.toUpperCase()}
                            </span>
                            {siswa.org === 'osis' || siswa.org === 'mpk' ? (
                              <span className="text-[11px] text-slate-400 ml-1.5 font-bold">({siswa.jabatan || 'Anggota'})</span>
                            ) : null}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10 flex-wrap">
            <button
              onClick={() => setStep(1)}
              className="btn-secondary flex items-center gap-2 font-bold px-4 py-2"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>

            <button
              onClick={handleCetakExcel}
              disabled={downloading || selectedSiswaKeys.length === 0}
              className={`btn-primary flex items-center gap-2 shadow-sm font-bold transition-all px-6 py-2.5 rounded-xl ${
                downloading || selectedSiswaKeys.length === 0
                  ? 'opacity-50 cursor-not-allowed bg-slate-300 border-slate-300 text-slate-400'
                  : `${activeTheme.iconBg} border-transparent text-white hover:opacity-90`
              }`}
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mencetak Excel...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Cetak Lembar Kehadiran (Excel)
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
