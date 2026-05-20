'use client'

import { useEffect, useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import { getAccessibleOrgs } from '@/lib/auth-shared'
import { 
  Camera, Plus, Calendar, User, Search, Trash2, X, Maximize2, 
  ChevronLeft, ChevronRight, Eye, ImageIcon, UploadCloud, Info, AlertCircle 
} from 'lucide-react'
import Image from 'next/image'

interface DokumentasiFoto {
  id: number
  organisasi_type: 'osis' | 'mpk' | 'programming' | 'english'
  judul: string
  deskripsi: string | null
  image_url: string
  public_id: string | null
  tanggal: string
  created_by: number
  created_at: string
  creator: {
    nama: string
    email: string
  }
}

interface Props {
  user: { id: number; nama: string; email: string; role: string }
}

export default function DokumentasiClient({ user }: Props) {
  const [photos, setPhotos] = useState<DokumentasiFoto[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Upload States
  const [uploading, setUploading] = useState(false)
  const [newJudul, setNewJudul] = useState('')
  const [newDeskripsi, setNewDeskripsi] = useState('')
  const [newTanggal, setNewTanggal] = useState(new Date().toISOString().split('T')[0])
  
  // Tentukan default organisasi berdasarkan role
  const accessibleOrgs = useMemo(() => getAccessibleOrgs(user.role), [user.role])
  const [newOrg, setNewOrg] = useState(accessibleOrgs[0] || 'osis')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // Lightbox States
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null)

  // Fetch photos
  const fetchPhotos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedOrg && selectedOrg !== 'all') params.append('org', selectedOrg)
      if (searchQuery) params.append('q', searchQuery)
      if (startDate) params.append('start', startDate)
      if (endDate) params.append('end', endDate)

      const res = await fetch(`/api/dokumentasi?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal memuat dokumentasi')
      setPhotos(json.data || [])
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPhotos()
  }, [selectedOrg, searchQuery, startDate, endDate])

  // Handle file selection
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPEG, PNG, WEBP, dll.)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }
    setSelectedFile(file)
    setFilePreview(URL.createObjectURL(file))
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileChange(file)
  }

  // Handle upload submit
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      toast.error('Silakan pilih gambar terlebih dahulu')
      return
    }
    if (!newJudul.trim()) {
      toast.error('Judul dokumentasi wajib diisi')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('judul', newJudul.trim())
      formData.append('deskripsi', newDeskripsi.trim())
      formData.append('organisasi_type', newOrg)
      formData.append('tanggal', newTanggal)

      const res = await fetch('/api/dokumentasi', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error || 'Gagal mengunggah dokumentasi')
      
      toast.success('Berhasil mengunggah dokumentasi foto!')

      // Reset form
      setNewJudul('')
      setNewDeskripsi('')
      setSelectedFile(null)
      setFilePreview(null)
      setShowUploadModal(false)
      
      fetchPhotos()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setUploading(false)
    }
  }

  // Handle delete
  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus dokumentasi "${title}"?`)) return
    try {
      const res = await fetch(`/api/dokumentasi?id=${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus dokumentasi')
      
      toast.success('Dokumentasi foto berhasil dihapus')
      fetchPhotos()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  // Organisasi Styling & Badge details
  const orgMeta: Record<string, { label: string; badge: string; color: string }> = {
    osis: {
      label: 'OSIS',
      badge: 'bg-amber-50 border-amber-200/50 text-amber-700',
      color: 'from-amber-500 to-amber-600',
    },
    mpk: {
      label: 'MPK',
      badge: 'bg-rose-50 border-rose-200/50 text-rose-700',
      color: 'from-rose-500 to-rose-600',
    },
    programming: {
      label: 'Programming',
      badge: 'bg-emerald-50 border-emerald-200/50 text-emerald-700',
      color: 'from-emerald-500 to-emerald-600',
    },
    english: {
      label: 'English Club',
      badge: 'bg-blue-50 border-blue-200/50 text-blue-700',
      color: 'from-blue-500 to-blue-600',
    },
  }

  // Lightbox navigation
  const activeLightboxPhoto = activeLightboxIndex !== null ? photos[activeLightboxIndex] : null

  const handlePrevLightbox = () => {
    if (activeLightboxIndex === null) return
    setActiveLightboxIndex(activeLightboxIndex === 0 ? photos.length - 1 : activeLightboxIndex - 1)
  }

  const handleNextLightbox = () => {
    if (activeLightboxIndex === null) return
    setActiveLightboxIndex(activeLightboxIndex === photos.length - 1 ? 0 : activeLightboxIndex + 1)
  }

  return (
    <div className="space-y-6">
      


      {/* ─── TOP FILTER PANEL ─── */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
              <Camera className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 tracking-tight">Galeri Dokumentasi Kegiatan</h2>
              <p className="text-xs text-slate-400">Total {photos.length} kegiatan terdokumentasi</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center justify-center gap-2 bg-[#052659] hover:bg-[#041d44] text-white px-4 py-2.5 rounded-2xl text-xs font-black shadow-lg shadow-[#052659]/10 transition-all duration-200 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Unggah Foto Kegiatan
          </button>
        </div>

        <hr className="border-slate-100" />

        {/* ─── FILTERS ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* SEARCH */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari judul kegiatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* ORGANISASI SELECT */}
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
          >
            <option value="all">Semua Organisasi</option>
            {accessibleOrgs.includes('osis') && <option value="osis">OSIS</option>}
            {accessibleOrgs.includes('mpk') && <option value="mpk">MPK</option>}
            {accessibleOrgs.includes('programming') && <option value="programming">Programming</option>}
            {accessibleOrgs.includes('english') && <option value="english">English Club</option>}
          </select>

          {/* DATE START */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase min-w-[28px]">Dari</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* DATE END */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase min-w-[32px]">Sampai</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

        </div>
      </div>

      {/* ─── PHOTOS GALLERY GRID ─── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200/50 rounded-3xl overflow-hidden shadow-sm animate-pulse space-y-4">
              <div className="aspect-[4/3] bg-slate-100" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                <div className="h-3 bg-slate-50 rounded-md w-1/2" />
                <div className="h-3 bg-slate-50 rounded-md w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="bg-white border border-slate-200/60 rounded-3xl p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col items-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-300 mb-4">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-slate-800">Belum Ada Dokumentasi Foto</h3>
          <p className="text-xs text-slate-400 mt-2">
            Silakan unggah foto kegiatan perdana Anda untuk mendokumentasikan aktivitas organisasi.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-5 inline-flex items-center gap-2 bg-[#052659] text-white text-xs font-bold px-4 py-2 rounded-xl"
          >
            <Plus className="w-4 h-4" />
            Unggah Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {photos.map((photo, index) => {
            const meta = orgMeta[photo.organisasi_type] || {
              label: photo.organisasi_type.toUpperCase(),
              badge: 'bg-slate-50 border-slate-200 text-slate-700',
              color: 'from-slate-500 to-slate-600',
            }

            return (
              <div 
                key={photo.id}
                className="group bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-lg hover:border-indigo-500/20 hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                {/* Image Cover */}
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                  <Image 
                    src={photo.image_url}
                    alt={photo.judul}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3">
                    <button
                      onClick={() => setActiveLightboxIndex(index)}
                      className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white flex items-center justify-center transition-colors"
                      title="Lihat Foto"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {accessibleOrgs.includes(photo.organisasi_type) && (
                      <button
                        onClick={() => handleDelete(photo.id, photo.judul)}
                        className="w-8 h-8 rounded-lg bg-red-600/30 hover:bg-red-600/60 backdrop-blur-sm text-white flex items-center justify-center transition-colors"
                        title="Hapus Dokumentasi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Org Type Badge */}
                  <span className={`absolute top-3 left-3 px-2 py-0.5 text-[9px] font-black tracking-wider uppercase rounded-md border backdrop-blur-sm ${meta.badge}`}>
                    {meta.label}
                  </span>
                </div>

                {/* Content Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {photo.judul}
                    </h3>
                    {photo.deskripsi && (
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                        {photo.deskripsi}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[9px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(photo.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1 max-w-[100px] truncate">
                      <User className="w-3 h-3 text-slate-400" />
                      {photo.creator.nama}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── UPLOAD MODAL ─── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowUploadModal(false)} />
          
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative z-10 animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-600" />
                <span className="text-sm font-extrabold text-slate-800">Unggah Dokumentasi Baru</span>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)} 
                className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              
              {/* IMAGE DRAG & DROP ZONE */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('image-uploader-input')?.click()}
                className={`border-2 border-dashed rounded-2xl aspect-[16/9] flex flex-col items-center justify-center p-5 text-center cursor-pointer transition-all ${
                  dragOver 
                    ? 'border-indigo-500 bg-indigo-50/30' 
                    : filePreview 
                      ? 'border-slate-200 bg-slate-50' 
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <input 
                  type="file" 
                  id="image-uploader-input"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileChange(file)
                  }}
                  className="hidden"
                />

                {filePreview ? (
                  <div className="relative w-full h-full rounded-lg overflow-hidden">
                    <Image 
                      src={filePreview} 
                      alt="Uploader Preview" 
                      fill 
                      className="object-contain"
                      unoptimized
                    />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-md text-[9px] font-black">
                      Klik untuk Mengganti
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-400 border border-slate-100">
                      <UploadCloud className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-700">Tarik gambar ke sini, atau klik untuk memilih</p>
                      <p className="text-[10px] text-slate-400 mt-1">JPEG, PNG, WEBP maksimal 5MB</p>
                    </div>
                  </div>
                )}
              </div>

              {/* INPUT: JUDUL */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Judul Kegiatan</label>
                <input 
                  type="text"
                  placeholder="Contoh: Rapat Koordinasi Anggota Baru"
                  value={newJudul}
                  onChange={(e) => setNewJudul(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* SELECT: ORGANISASI */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Organisasi</label>
                  <select
                    value={newOrg}
                    onChange={(e) => setNewOrg(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                  >
                    {accessibleOrgs.includes('osis') && <option value="osis">OSIS</option>}
                    {accessibleOrgs.includes('mpk') && <option value="mpk">MPK</option>}
                    {accessibleOrgs.includes('programming') && <option value="programming">Programming</option>}
                    {accessibleOrgs.includes('english') && <option value="english">English Club</option>}
                  </select>
                </div>

                {/* INPUT: TANGGAL */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Kegiatan</label>
                  <input 
                    type="date"
                    value={newTanggal}
                    onChange={(e) => setNewTanggal(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* INPUT: DESKRIPSI */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Deskripsi / Keterangan (Opsional)</label>
                <textarea 
                  placeholder="Tulis detail singkat kegiatan..."
                  value={newDeskripsi}
                  onChange={(e) => setNewDeskripsi(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                  disabled={uploading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#052659] text-white rounded-xl text-xs font-black shadow-lg shadow-[#052659]/10 hover:bg-[#041d44] flex items-center gap-2"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Mengunggah...
                    </>
                  ) : (
                    'Simpan Dokumentasi'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ─── LIGHTBOX VIEW ─── */}
      {activeLightboxPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between">
          
          {/* Header Lightbox */}
          <div className="p-4 flex items-center justify-between text-white relative z-10 bg-gradient-to-b from-black/60 to-transparent">
            <div>
              <span className="px-2 py-0.5 text-[9px] font-extrabold tracking-wider uppercase rounded-md border border-white/20 bg-white/10 backdrop-blur-sm mr-2">
                {orgMeta[activeLightboxPhoto.organisasi_type]?.label || activeLightboxPhoto.organisasi_type.toUpperCase()}
              </span>
              <span className="text-xs font-black">{activeLightboxPhoto.judul}</span>
            </div>
            <button 
              onClick={() => setActiveLightboxIndex(null)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Body Viewer */}
          <div className="flex-1 flex items-center justify-center relative px-10">
            
            {/* Left Button */}
            <button
              onClick={handlePrevLightbox}
              className="absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* HD image */}
            <div className="relative w-full h-[70vh]">
              <Image 
                src={activeLightboxPhoto.image_url}
                alt={activeLightboxPhoto.judul}
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            {/* Right Button */}
            <button
              onClick={handleNextLightbox}
              className="absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

          </div>

          {/* Footer Lightbox Captions */}
          <div className="p-6 text-white text-center bg-gradient-to-t from-black/80 to-transparent relative z-10 space-y-2">
            {activeLightboxPhoto.deskripsi && (
              <p className="text-xs text-slate-200 max-w-2xl mx-auto leading-relaxed">
                {activeLightboxPhoto.deskripsi}
              </p>
            )}
            <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(activeLightboxPhoto.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                Diupload oleh {activeLightboxPhoto.creator.nama}
              </span>
            </div>
          </div>

        </div>
      )}

    </div>
  )
}
