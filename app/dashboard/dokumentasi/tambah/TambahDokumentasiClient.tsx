'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DocumentationForm from '@/components/documentation/DocumentationForm'
import { Camera, ChevronLeft } from 'lucide-react'

interface Props {
  user: any
}

// Static org map — no need to fetch from API
const ORG_MAP: Record<string, { id: number; nama: string }> = {
  osis:        { id: 1, nama: 'OSIS' },
  mpk:         { id: 2, nama: 'MPK' },
  programming: { id: 3, nama: 'Programming Club' },
  english:     { id: 4, nama: 'English Club' },
}

const ORG_LABELS: Record<string, string> = {
  osis:        'OSIS',
  mpk:         'MPK',
  programming: 'Programming Club',
  english:     'English Club',
}

export default function TambahDokumentasiClient({ user }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const orgType = searchParams.get('org') || 'osis'
  const org = ORG_MAP[orgType] || ORG_MAP['osis']

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
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
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Tambah Dokumentasi Baru</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Unit: {ORG_LABELS[orgType] || orgType}
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-deep-navy border border-white/10 rounded-3xl p-8 shadow-sm">
        <DocumentationForm
          organizationId={org.id}
          type={orgType as any}
          onSubmitSuccess={() => router.push('/dashboard/dokumentasi')}
        />
      </div>
    </div>
  )
}
