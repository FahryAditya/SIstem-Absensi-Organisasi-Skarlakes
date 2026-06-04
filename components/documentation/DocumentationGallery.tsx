'use client'

import React, { useState } from 'react'
import Image from 'next/image'

interface Props {
  photoUrl: string
  title: string
}

export default function DocumentationGallery({ photoUrl, title }: Props) {
  const photos = photoUrl.split(',').map(url => url.trim()).filter(Boolean)
  const [activeIndex, setActiveIndex] = useState(0)

  if (photos.length === 0) return null

  const activePhoto = photos[activeIndex] || photos[0]

  return (
    <div className="space-y-4">
      {/* Main Image View */}
      <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded-[2rem] overflow-hidden border border-slate-100 bg-slate-50 shadow-inner group">
        <Image
          src={activePhoto}
          alt={`${title} - Foto ${activeIndex + 1}`}
          fill
          className="object-cover transition-all duration-500 ease-out"
          unoptimized
        />
        {/* Subtle Overlay indicating multiple photos */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider">
            {activeIndex + 1} / {photos.length}
          </div>
        )}
      </div>

      {/* Thumbnails Row */}
      {photos.length > 1 && (
        <div className="flex flex-wrap gap-3.5 pt-2">
          {photos.map((url, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`relative w-24 aspect-[4/3] rounded-2xl overflow-hidden border-2 transition-all duration-300 active:scale-95 flex-shrink-0 ${
                activeIndex === idx
                  ? 'border-indigo-600 shadow-md shadow-indigo-600/10 scale-105'
                  : 'border-slate-200 hover:border-slate-300 hover:scale-102 bg-white'
              }`}
            >
              <Image
                src={url}
                alt={`${title} Thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
              {activeIndex !== idx && (
                <div className="absolute inset-0 bg-black/5 hover:bg-transparent transition-colors" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
