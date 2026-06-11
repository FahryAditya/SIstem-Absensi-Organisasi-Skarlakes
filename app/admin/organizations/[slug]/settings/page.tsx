import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Settings, Save, MapPin, Calendar, Clock, Info } from 'lucide-react'

export default async function OrgSettingsPage({ params }: { params: { slug: string } }) {
  const org = await prisma.organization.findUnique({
    where: { slug: params.slug }
  })

  if (!org) notFound()

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
        <button className="btn-primary">
          <Save className="w-4 h-4" />
          Simpan Perubahan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-persian-blue" /> Profil Dasar
          </h3>
          <div className="form-group">
            <label className="label text-[11px]">Nama Organisasi / Eskul</label>
            <input defaultValue={org.nama} className="input text-sm" />
          </div>
          <div className="form-group">
            <label className="label text-[11px]">Kategori</label>
            <input defaultValue={org.category} className="input text-sm" disabled />
          </div>
          <div className="form-group">
            <label className="label text-[11px]">Deskripsi</label>
            <textarea defaultValue={org.deskripsi || ''} rows={3} className="input text-sm resize-none" placeholder="Ceritakan tentang unit ini..." />
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-green-500" /> Jadwal & Lokasi
          </h3>
          <div className="form-group">
            <label className="label text-[11px]">Hari Pertemuan</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input defaultValue={org.hari_pertemuan || ''} className="input pl-10 text-sm" placeholder="Misal: Jumat" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label text-[11px]">Mulai</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input defaultValue={org.waktu_mulai || ''} className="input pl-10 text-sm" placeholder="14:00" />
              </div>
            </div>
            <div className="form-group">
              <label className="label text-[11px]">Selesai</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input defaultValue={org.waktu_selesai || ''} className="input pl-10 text-sm" placeholder="16:00" />
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="label text-[11px]">Lokasi / Ruangan</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input defaultValue={org.lokasi || ''} className="input pl-10 text-sm" placeholder="Misal: Lab Komputer 1" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-black text-red-500">Zona Bahaya</h4>
          <p className="text-[10px] text-slate-500 mt-0.5">Menonaktifkan unit akan menghentikan seluruh aktivitas pendaftaran dan absensi.</p>
        </div>
        <button className="px-4 py-2 rounded-xl border border-red-500/50 text-red-500 text-xs font-bold hover:bg-red-500/10 transition-all">
          Nonaktifkan Unit
        </button>
      </div>
    </div>
  )
}
