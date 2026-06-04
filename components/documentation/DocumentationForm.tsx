'use client'

import React, { useState, useEffect } from 'react'
import { Camera, UploadCloud, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import CategorySelector from './CategorySelector'

interface Props {
  organizationId: number
  type: 'osis' | 'mpk' | 'programming' | 'english'
  initialData?: any
  onSubmitSuccess: (data: any) => void
}

export default function DocumentationForm({ organizationId, type, initialData, onSubmitSuccess }: Props) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [category, setCategory] = useState(initialData?.category || '')
  const [dateTaken, setDateTaken] = useState(initialData?.dateTaken ? new Date(initialData.dateTaken).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
  const [photos, setPhotos] = useState<{ url: string; publicId: string }[]>(() => {
    if (initialData?.photoUrl) {
      const urls = initialData.photoUrl.split(',').map((u: string) => u.trim()).filter(Boolean)
      const ids = initialData.publicId ? initialData.publicId.split(',').map((id: string) => id.trim()).filter(Boolean) : []
      return urls.map((url: string, index: number) => ({
        url,
        publicId: ids[index] || ''
      }))
    }
    return []
  })
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remainingSlots = 4 - photos.length
    if (files.length > remainingSlots) {
      toast.error(`Anda hanya dapat mengunggah maksimal ${remainingSlots} foto lagi.`)
      return
    }

    setUploading(true)
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File "${file.name}" terlalu besar. Maksimal 5MB.`)
        continue
      }

      try {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/documentation/upload-photo', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `Gagal mengunggah ${file.name}`)

        setPhotos(prev => [...prev, { url: data.url, publicId: data.publicId }])
        toast.success(`Foto "${file.name}" berhasil diunggah`)
      } catch (err: any) {
        toast.error(err.message)
      }
    }
    setUploading(false)
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !description || !category) {
      toast.error('Judul, kategori, dan deskripsi wajib diisi')
      return
    }

    if (photos.length === 0) {
      toast.error('Wajib mengunggah minimal 1 foto')
      return
    }

    const photoUrlStr = photos.map(p => p.url).join(',')
    const publicIdStr = photos.map(p => p.publicId).join(',')

    setSubmitting(true)
    try {
      const url = initialData 
        ? `/api/documentation/${initialData.id}` 
        : '/api/documentation/create'
      
      const method = initialData ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          dateTaken: new Date(dateTaken).toISOString(),
          photoUrl: photoUrlStr,
          publicId: publicIdStr,
          organizationId,
          type
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan dokumentasi')

      toast.success(initialData ? 'Dokumentasi diperbarui' : 'Dokumentasi berhasil dibuat')
      onSubmitSuccess(data.data)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo Upload */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-slate-500 uppercase">Foto Dokumentasi (Maksimal 4)</label>
          <span className="text-xs font-bold text-slate-400">{photos.length}/4 Foto</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {photos.map((p, index) => (
            <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group">
              <Image src={p.url} alt={`Preview ${index + 1}`} fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-md active:scale-90"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {photos.length < 4 && (
            <div 
              onClick={() => !uploading && document.getElementById('photo-input')?.click()}
              className={`relative aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                uploading 
                  ? 'border-slate-200 bg-slate-50 cursor-not-allowed' 
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/10'
              }`}
            >
              {uploading ? (
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              ) : (
                <>
                  <UploadCloud className="w-6 h-6 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 mt-2 text-center px-2">
                    Tambah Foto
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <input 
          id="photo-input" 
          type="file" 
          accept="image/*" 
          multiple
          className="hidden" 
          onChange={handleFileChange} 
          disabled={uploading || photos.length >= 4}
        />
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase">Judul Kegiatan</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Contoh: Pertemuan Rutin Mingguan"
          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          maxLength={200}
        />
      </div>

      {/* Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase">Kategori</label>
          <CategorySelector type={type} value={category} onChange={setCategory} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase">Kapan Diambil</label>
          <input
            type="date"
            value={dateTaken}
            onChange={(e) => setDateTaken(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase">Deskripsi</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tuliskan detail kegiatan di sini..."
          rows={4}
          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="submit"
          disabled={uploading || submitting}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {initialData ? 'Perbarui Dokumentasi' : 'Publikasikan Dokumentasi'}
        </button>
      </div>
    </form>
  )
}
