import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, User, Tag, Edit, Trash2 } from 'lucide-react'

interface Props {
  doc: any
  canManage: boolean
  onEdit?: (doc: any) => void
  onDelete?: (id: number) => void
}

export default function DocumentationCard({ doc, canManage, onEdit, onDelete }: Props) {
  return (
    <div className="group bg-deep-navy border border-white/10 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="relative aspect-video overflow-hidden">
        <Image 
          src={doc.photoUrl.split(',')[0]} 
          alt={doc.title} 
          fill 
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized
        />
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-white shadow-sm flex items-center gap-1.5 border border-white/20">
            <Tag className="w-3 h-3 text-persian-blue/100" />
            {doc.category}
          </span>
        </div>

        {canManage && (
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit?.(doc)}
              className="p-2 bg-white/90 backdrop-blur-md rounded-xl text-slate-300 hover:text-persian-blue shadow-sm border border-white/20"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete?.(doc.id)}
              className="p-2 bg-red-500/10/90 backdrop-blur-md rounded-xl text-red-600 hover:bg-red-500/100 hover:text-white shadow-sm border border-red-100/20"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="p-5 space-y-3">
        <div className="space-y-1">
          <Link href={`/dokumentasi/${doc.id}`}>
            <h3 className="font-extrabold text-white line-clamp-1 group-hover:text-persian-blue transition-colors cursor-pointer">
              {doc.title}
            </h3>
          </Link>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {doc.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wide">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(doc.dateTaken).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {doc.creator.nama}
          </div>
        </div>
      </div>
    </div>
  )
}
