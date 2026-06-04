'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DocumentationForm from '@/components/documentation/DocumentationForm'
import { Camera, ChevronLeft } from 'lucide-react'

interface Props {
  user: any
}

export default function TambahDokumentasiClient({ user }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [organizations, setOrganizations] = useState<any[]>([])
  
  const orgTypeFromQuery = searchParams.get('org') || 'osis'

  useEffect(() => {
    const fetchOrgs = async () => {
      const res = await fetch('/api/organizations')
      const data = await res.json()
      if (res.ok) setOrganizations(data.data)
    }
    fetchOrgs()
  }, [])

  const selectedOrg = organizations.find(o => o.tipe === orgTypeFromQuery)

  if (organizations.length === 0) return null

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm">
            <Camera className="w-5 h-5 text-indigo-600" />
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Tambah Dokumentasi Baru</h1>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <DocumentationForm 
          organizationId={selectedOrg?.id || organizations[0].id}
          type={orgTypeFromQuery as any}
          onSubmitSuccess={() => router.push('/dashboard/dokumentasi')}
        />
      </div>
    </div>
  )
}
