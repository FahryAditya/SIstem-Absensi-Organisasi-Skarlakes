"use client"

import { useState, useMemo } from 'react'
import { Mail, Search, Check, AlertTriangle, Users } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Member {
  id: number
  nama: string
  kelas: string | null
  jabatan: string | null
  email: string | null
}

interface SendEmailFormProps {
  organizationType: string // 'programming' | 'english' | 'osis' | 'mpk'
  members: Member[]
}

const EMAIL_TYPES: Record<string, string[]> = {
  programming: ['pertemuan'],
  english: ['pertemuan'],
  osis: ['rapat'],
  mpk: ['rapat'],
}

export default function SendEmailForm({ organizationType, members }: SendEmailFormProps) {
  const orgKey = organizationType.toLowerCase()
  const emailTypes = EMAIL_TYPES[orgKey] || ['pertemuan']
  
  const [emailType, setEmailType] = useState(emailTypes[0] || '')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    tanggal: '',
    waktu: '',
    tempat: '',
    pembahasan: '',
    masalah: '',
  })

  // Filter members list based on query
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = searchQuery.toLowerCase()
      return (
        m.nama.toLowerCase().includes(q) ||
        (m.kelas && m.kelas.toLowerCase().includes(q)) ||
        (m.jabatan && m.jabatan.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q))
      )
    })
  }, [members, searchQuery])

  // Checked/unchecked state helpers
  const handleToggleMember = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleToggleSelectAll = () => {
    const visibleIds = filteredMembers.map(m => m.id)
    const allVisibleSelected = visibleIds.every(id => selectedIds.includes(id))

    if (allVisibleSelected) {
      // Deselect all visible
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)))
    } else {
      // Select all visible
      setSelectedIds(prev => {
        const union = new Set([...prev, ...visibleIds])
        return Array.from(union)
      })
    }
  }

  const isAllVisibleSelected = useMemo(() => {
    if (filteredMembers.length === 0) return false
    return filteredMembers.every(m => selectedIds.includes(m.id))
  }, [filteredMembers, selectedIds])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!emailType) {
      toast.error('Pilih tipe email terlebih dahulu')
      return
    }
    if (selectedIds.length === 0) {
      toast.error('Pilih minimal 1 anggota penerima email')
      return
    }
    if (!formData.tanggal || !formData.waktu || !formData.tempat || !formData.pembahasan.trim()) {
      toast.error('Lengkapi semua detail pertemuan/rapat terlebih dahulu')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationType: orgKey,
          emailType,
          recipientIds: selectedIds,
          data: formData,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim email')

      toast.success(`Berhasil! ${data.message}`)
      setSelectedIds([])
      setFormData({
        tanggal: '',
        waktu: '',
        tempat: '',
        pembahasan: '',
        masalah: '',
      })
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Email Type Selector */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">Jenis Email</label>
        <div className="flex gap-2">
          {emailTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setEmailType(type)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all uppercase ${
                emailType === type
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Event details form */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Detail Agenda Rapat / Kegiatan</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Tanggal Rapat</label>
            <input
              type="date"
              value={formData.tanggal}
              onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Waktu</label>
            <input
              type="text"
              placeholder="Contoh: 14:00 - 16:00 WIB"
              value={formData.waktu}
              onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Tempat / Ruangan</label>
          <input
            type="text"
            placeholder="Contoh: Ruang Meeting / Google Meet"
            value={formData.tempat}
            onChange={(e) => setFormData({ ...formData, tempat: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            {orgKey === 'osis' || orgKey === 'mpk' ? 'Agenda Utama Rapat' : 'Materi Pembahasan'}
          </label>
          <textarea
            rows={3}
            placeholder="Tuliskan agenda atau poin-poin yang akan dibahas..."
            value={formData.pembahasan}
            onChange={(e) => setFormData({ ...formData, pembahasan: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
            required
          />
        </div>

        {(orgKey === 'osis' || orgKey === 'mpk') && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Masalah / Latar Belakang (Opsional)</label>
            <textarea
              rows={2}
              placeholder="Tuliskan masalah krusial yang akan dipecahkan di rapat..."
              value={formData.masalah}
              onChange={(e) => setFormData({ ...formData, masalah: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        )}
      </div>

      {/* 3. Recipient list */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" /> Pilih Penerima Email ({selectedIds.length} Terpilih)
          </label>
          
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition text-left"
          >
            {isAllVisibleSelected ? 'Batalkan Semua Pilihan' : 'Pilih Semua Anggota Hasil Cari'}
          </button>
        </div>

        {/* Search recipient */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari anggota berdasarkan nama, kelas, jabatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
          />
        </div>

        {/* List of members with custom checkbox */}
        <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.01]">
          <div className="max-h-72 overflow-y-auto divide-y divide-white/5 scrollbar-thin">
            {filteredMembers.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">Tidak ada anggota yang cocok dengan pencarian.</p>
            ) : (
              filteredMembers.map((member) => {
                const isSelected = selectedIds.includes(member.id)
                const hasNoEmail = !member.email

                return (
                  <div
                    key={member.id}
                    onClick={() => !hasNoEmail && handleToggleMember(member.id)}
                    className={`flex items-center justify-between gap-4 p-3 transition-colors ${
                      hasNoEmail 
                        ? 'opacity-40 cursor-not-allowed' 
                        : 'cursor-pointer hover:bg-white/5'
                    } ${isSelected ? 'bg-blue-500/5' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Custom styled checkbox */}
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-blue-500 border-blue-500 text-white' 
                          : 'border-white/20'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>

                      <div className="text-left">
                        <p className="text-sm font-semibold text-white flex items-center gap-2">
                          {member.nama}
                          {member.kelas && (
                            <span className="text-[10px] bg-white/10 text-slate-300 px-1.5 py-0.5 rounded">
                              {member.kelas}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-[300px]">
                          {member.email || 'Email tidak diset'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {member.jabatan && (
                        <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-medium">
                          {member.jabatan}
                        </span>
                      )}
                      {hasNoEmail && (
                        <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> NO EMAIL
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. Action button */}
      <button
        type="submit"
        disabled={loading || selectedIds.length === 0}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:opacity-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Sedang mengirim email...
          </span>
        ) : (
          <>
            <Mail className="w-5 h-5" />
            Kirim Notifikasi Ke {selectedIds.length} Penerima
          </>
        )}
      </button>
    </form>
  )
}
