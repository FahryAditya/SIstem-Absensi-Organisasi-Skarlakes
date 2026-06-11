import React, { useState } from 'react'

interface Props {
  type: 'osis' | 'mpk' | 'programming' | 'english'
  value: string
  onChange: (value: string) => void
}

const CATEGORIES: Record<string, string[]> = {
  osis: ['Jumat Seni', 'Jumat Olahraga', 'Jumat Religius', 'Rapat Pengurus', 'Kegiatan Sosial', 'Peringatan Hari Besar', 'Petugas Upacara', 'Panitia (Bisa Costume)', 'Piket Kebersihan & Penyambutan'],
  mpk: ['Jumat Seni', 'Jumat Olahraga', 'Jumat Religius', 'Rapat Pengurus', 'Sidang MPK', 'Peringatan Hari Besar', 'Petugas Upacara', 'Panitia (Bisa Costume)', 'Piket Kebersihan & Penyambutan'],
  programming: ['Pertemuan Rutin', 'Webinar', 'Workshop', 'Kompetisi', 'Hackathon', 'Demo Project'],
  english: ['Pertemuan Rutin', 'Speaking Session', 'Debate Club', 'Listening Class', 'English Day', 'Movie Night'],
}

export default function CategorySelector({ type, value, onChange }: Props) {
  const [isCustom, setIsCustom] = useState(!CATEGORIES[type]?.includes(value) && value !== '')
  const fixedCategories = CATEGORIES[type] || []

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val === 'custom') {
      setIsCustom(true)
      onChange('')
    } else {
      setIsCustom(false)
      onChange(val)
    }
  }

  return (
    <div className="space-y-2">
      <select
        value={isCustom ? 'custom' : value}
        onChange={handleSelectChange}
        className="w-full px-3 py-2 text-sm border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-persian-blue/100/20"
      >
        <option value="" disabled>Pilih Kategori</option>
        {fixedCategories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
        <option value="custom">Lainnya (Kustom)</option>
      </select>

      {isCustom && (
        <input
          type="text"
          placeholder="Masukkan kategori kustom..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-persian-blue/100/20 animate-in fade-in slide-in-from-top-1"
        />
      )}
    </div>
  )
}
