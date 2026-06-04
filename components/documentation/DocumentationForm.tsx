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
  const [photoUrl, setPhotoUrl] = useState(initialData?.photoUrl || '')
  const [publicId, setPublicId] = useState(initialData?.publicId || '')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [filePreview, setFilePreview] = useState(initialData?.photoUrl || null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File terlalu besar. Maksimal 5MB.')
      return
    }

    setUploading(true)
    setFilePreview(URL.createObjectURL(file))

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/documentation/upload-photo', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal upload foto')

      setPhotoUrl(data.url)
      setPublicId(data.publicId)
      toast.success('Foto berhasil diunggah')
    } catch (err: any) {
      toast.error(err.message)
      setFilePreview(photoUrl) // Revert to old preview if exists
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !description || !category || !photoUrl) {
      toast.error('Semua field wajib diisi')
      return
    }

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
          photoUrl,
          publicId,
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
        <label className="text-xs font-bold text-slate-500 uppercase">Foto Dokumentasi</label>
        <div 
          className={`relative aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all ${
            filePreview ? 'border-slate-200' : 'border-slate-300 hover:border-indigo-400 bg-slate-50'
          }`}
        >
          {filePreview ? (
            <>
              <Image src={filePreview} alt="Preview" fill className="object-cover" unoptimized />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => document.getElementById('photo-input')?.click()}
                  className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Ganti Foto
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => document.getElementById('photo-input')?.click()}
              className="flex flex-col items-center gap-2 text-slate-400"
            >
              <UploadCloud className="w-10 h-10" />
              <span className="text-xs font-medium">Klik untuk upload foto (Max 5MB)</span>
            </button>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          )}
        </div>
        <input 
          id="photo-input" 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileChange} 
          disabled={uploading}
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
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase">Kategori</label>
        <CategorySelector type={type} value={category} onChange={setCategory} />
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
