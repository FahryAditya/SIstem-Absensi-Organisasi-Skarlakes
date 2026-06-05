'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DocumentationForm from '@/components/documentation/DocumentationForm'
import { Camera, ChevronLeft, Loader2 } from 'lucide-react'

interface Props {
  user: any
  id: string
}

export default function EditDokumentasiClient({ user, id }: Props) {
  const router = useRouter()
  const [doc, setDoc] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await fetch(`/api/documentation`) // We'll need a single get API or use the list with ID
        // Actually I should have a GET /api/documentation/[id]
        const res2 = await fetch(`/api/documentation/${id}`)
        const data = await res2.json()
        if (res2.ok) setDoc(data.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchDoc()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-persian-blue animate-spin" />
      </div>
    )
  }

  if (!doc) return <div>Dokumentasi tidak ditemukan.</div>

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-slate-300" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-persian-blue/10 rounded-xl border border-persian-blue/20 shadow-sm">
            <Camera className="w-5 h-5 text-persian-blue" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">Edit Dokumentasi</h1>
        </div>
      </div>

      <div className="bg-deep-navy border border-white/10 rounded-3xl p-8 shadow-sm">
        <DocumentationForm 
          organizationId={doc.organizationId}
          type={doc.type}
          initialData={doc}
          onSubmitSuccess={() => router.push('/dashboard/dokumentasi')}
        />
      </div>
    </div>
  )
}
