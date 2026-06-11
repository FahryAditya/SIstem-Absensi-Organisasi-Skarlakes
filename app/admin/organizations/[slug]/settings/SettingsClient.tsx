'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Settings, Save, MapPin, Calendar, Clock, Info, School, Loader2 } from 'lucide-react'
import Select from '@/components/ui/Select'
import { clearJsonCache } from '@/lib/client-cache'

interface OrgData {
  id: number
  nama: string
  slug: string | null
  category: string
  school_origin: string
  status: string
  deskripsi: string | null
  hari_pertemuan: string | null
  waktu_mulai: string | null
  waktu_selesai: string | null
  lokasi: string | null
}

interface Props {
  org: OrgData
}

export default function SettingsClient({ org }: Props) {
  const [loading, setLoading] = useState(false)
  const [fNama, setFNama] = useState(org.nama)
  const [fDeskripsi, setFDeskripsi] = useState(org.deskripsi || '')
  const [fSchool, setFSchool] = useState(org.school_origin)
  const [fHari, setFHari] = useState(org.hari_pertemuan || '')
  const [fMulai, setFMulai] = useState(org.waktu_mulai || '')
  const [fSelesai, setFSelesai] = useState(org.waktu_selesai || '')
  const [fLokasi, setFLokasi] = useState(org.lokasi || '')
  const [fStatus, setFStatus] = useState(org.status)

  async function handleSave() {
    if (!fNama.trim()) {
      toast.error('Nama unit wajib diisi')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/organizations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: org.id,
          nama: fNama.trim(),
          deskripsi: fDeskripsi.trim(),
          school_origin: fSchool,
          hari_pertemuan: fHari.trim(),
          waktu_mulai: fMulai.trim(),
          waktu_selesai: fSelesai.trim(),
          lokasi: fLokasi.trim(),
          status: fStatus
        })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan perubahan')
      
      toast.success('Pengaturan berhasil disimpan')
      clearJsonCache()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const schoolOptions = [
    { value: 'SMK Airlangga Balikpapan', label: 'SMK Airlangga Balikpapan' },
    { value: 'SMK Kesehatan Airlangga Balikpapan', label: 'SMK Kesehatan Airlangga Balikpapan' },
    { value: 'Gabungan Dua Sekolah', label: 'Gabungan 2 Sekolah' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-slate-400" />
            Pengaturan Unit
          </h2>
          <p className="text-xs text-slate-400 mt-1">Sesuaikan profil dan informasi operasional {org.nama}</p>
        </div>
        <button onClick={handleSave} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Perubahan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-persian-blue" /> Profil Dasar
          </h3>
          <div className="form-group">
            <label className="label text-[11px]">Nama Organisasi / Eskul *</label>
            <input value={fNama} onChange={e => setFNama(e.target.value)} className="input text-sm" />
          </div>
          <div className="form-group">
            <label className="label text-[11px]">Asal Sekolah *</label>
            <div className="relative">
              <School className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10" />
              <Select
                value={fSchool}
                onChange={setFSchool}
                options={schoolOptions}
                className="pl-0"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="label text-[11px]">Kategori</label>
            <input value={org.category} className="input text-sm opacity-50 cursor-not-allowed" disabled />
          </div>
          <div className="form-group">
            <label className="label text-[11px]">Deskripsi</label>
            <textarea value={fDeskripsi} onChange={e => setFDeskripsi(e.target.value)} rows={3} className="input text-sm resize-none" placeholder="Ceritakan tentang unit ini..." />
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-green-500" /> Jadwal & Lokasi
          </h3>
          <div className="form-group">
            <label className="label text-[11px]">Hari Pertemuan</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={fHari} onChange={e => setFHari(e.target.value)} className="input pl-10 text-sm" placeholder="Misal: Jumat" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label text-[11px]">Mulai</label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input value={fMulai} onChange={e => setFMulai(e.target.value)} className="input pl-10 text-sm" placeholder="14:00" />
              </div>
            </div>
            <div className="form-group">
              <label className="label text-[11px]">Selesai</label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input value={fSelesai} onChange={e => setFSelesai(e.target.value)} className="input pl-10 text-sm" placeholder="16:00" />
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="label text-[11px]">Lokasi / Ruangan</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={fLokasi} onChange={e => setFLokasi(e.target.value)} className="input pl-10 text-sm" placeholder="Misal: Lab Komputer 1" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-black text-red-500">Status Aktif Unit</h4>
          <p className="text-[10px] text-slate-500 mt-0.5">Ubah status unit untuk mengontrol akses pendaftaran dan operasional.</p>
        </div>
        <div className="w-40">
          <Select
            value={fStatus}
            onChange={setFStatus}
            options={[
              { value: 'Aktif', label: 'Aktif' },
              { value: 'Tidak Aktif', label: 'Nonaktif' }
            ]}
            size="sm"
          />
        </div>
      </div>
    </div>
  )
}
