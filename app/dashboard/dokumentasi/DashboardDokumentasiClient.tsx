'use client'

import React, { useState } from 'react'
import { getAccessibleOrgs } from '@/lib/auth-shared'
import DocumentationList from '@/components/documentation/DocumentationList'
import { useRouter } from 'next/navigation'
import { Camera, Plus } from 'lucide-react'

interface Props {
  user: any
}

// Static org map
const ORG_MAP: Record<string, { id: number; nama: string }> = {
  osis:        { id: 1, nama: 'OSIS' },
  mpk:         { id: 2, nama: 'MPK' },
  programming: { id: 3, nama: 'Programming Club' },
  english:     { id: 4, nama: 'English Club' },
}

export default function DashboardDokumentasiClient({ user }: Props) {
  const router = useRouter()
  const accessibleOrgs = getAccessibleOrgs(user.role)
  const [activeTab, setActiveTab] = useState(accessibleOrgs[0] || 'osis')

  const currentOrg = ORG_MAP[activeTab]

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-persian-blue/10 rounded-2xl border border-persian-blue/20 shadow-sm">
            <Camera className="w-6 h-6 text-persian-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Manajemen Dokumentasi</h1>
            <p className="text-sm text-slate-400 font-medium">Kelola galeri kegiatan dan dokumentasi organisasi Anda.</p>
          </div>
        </div>

        <button
          onClick={() => router.push(`/dashboard/dokumentasi/tambah?org=${activeTab}`)}
          className="bg-persian-blue text-white px-5 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 shadow-lg shadow-persian-blue/10 hover:bg-blue-300 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Tambah Dokumentasi
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white/10 rounded-2xl w-fit">
        {accessibleOrgs.map((org) => (
          <button
            key={org}
            onClick={() => setActiveTab(org)}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === org
                ? 'bg-deep-navy text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {org}
          </button>
        ))}
      </div>

      <DocumentationList
        organizationId={currentOrg?.id}
        type={activeTab}
        user={user}
        onAddClick={() => router.push(`/dashboard/dokumentasi/tambah?org=${activeTab}`)}
        onEditClick={(doc) => router.push(`/dashboard/dokumentasi/${doc.id}/edit`)}
      />
    </div>
  )
}
