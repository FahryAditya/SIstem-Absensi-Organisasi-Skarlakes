'use client'

import React, { useState, useEffect } from 'react'
import { Search, Filter, Loader2, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import DocumentationCard from './DocumentationCard'
import { canManageDocumentation } from '@/lib/documentation-auth'

interface Props {
  organizationId?: number
  type?: string
  user: any
  onAddClick?: () => void
  onEditClick?: (doc: any) => void
}

export default function DocumentationList({ organizationId, type, user, onAddClick, onEditClick }: Props) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)
  const [search, setSearch] = useState('')

  const fetchDocs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (organizationId) params.append('organizationId', organizationId.toString())
      if (type) params.append('type', type)
      params.append('page', page.toString())
      params.append('limit', '8')

      const res = await fetch(`/api/documentation?${params}`)
      const data = await res.json()
      if (res.ok) {
        setDocs(data.data)
        setPagination(data.pagination)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocs()
  }, [organizationId, type, page])

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus dokumentasi ini?')) return
    
    try {
      const res = await fetch(`/api/documentation/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchDocs()
      } else {
        const data = await res.json()
        alert(data.error || 'Gagal menghapus')
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari dokumentasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-persian-blue/100/20"
          />
        </div>
        
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="bg-persian-blue text-white px-5 py-2 rounded-2xl text-sm font-black flex items-center gap-2 shadow-lg shadow-persian-blue/10 hover:bg-blue-300 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Tambah Dokumentasi
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-video bg-white/10 rounded-3xl" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
          <p className="text-slate-400 text-sm font-medium">Belum ada dokumentasi ditemukan.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {docs.map((doc: any) => (
              <DocumentationCard 
                key={doc.id} 
                doc={doc} 
                canManage={canManageDocumentation(user.role, doc.createdBy, user.id, doc.type)}
                onEdit={onEditClick}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-8">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-2 border border-white/10 rounded-xl disabled:opacity-50 hover:bg-white/5 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-300" />
              </button>
              <span className="text-sm font-bold text-slate-400">
                Halaman {page} dari {pagination.pages}
              </span>
              <button
                disabled={page === pagination.pages}
                onClick={() => setPage(page + 1)}
                className="p-2 border border-white/10 rounded-xl disabled:opacity-50 hover:bg-white/5 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
