'use client'

import React, { useState, useEffect } from 'react'
import { Camera, Search, Filter, Plus } from 'lucide-react'
import DocumentationList from '@/components/documentation/DocumentationList'
import { getAccessibleOrgs } from '@/lib/auth-shared'
import { useRouter } from 'next/navigation'

interface Props {
  user: any
}

export default function DokumentasiClient({ user }: Props) {
  const router = useRouter()
  const accessibleOrgs = getAccessibleOrgs(user.role)
  const [activeTab, setActiveTab] = useState('all')
  const [organizations, setOrganizations] = useState<any[]>([])

  const canAdd = ['administrator', 'admin_programming', 'admin_english', 'admin_osis_mpk'].includes(user.role)

  useEffect(() => {
    const fetchOrgs = async () => {
      const res = await fetch('/api/organizations')
      const data = await res.json()
      if (res.ok) setOrganizations(data.data)
    }
    fetchOrgs()
  }, [])

  const currentOrg = organizations.find(o => o.tipe === activeTab)

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm">
            <Camera className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dokumentasi Kegiatan</h1>
            <p className="text-sm text-slate-400 font-medium">Lihat semua kegiatan dan pencapaian organisasi kami.</p>
          </div>
        </div>

        {canAdd && (
          <button
            onClick={() => router.push('/dashboard/dokumentasi/tambah')}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 shadow-lg shadow-indigo-600/10 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Tambah Dokumentasi
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'all' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Semua
        </button>
        {['osis', 'mpk', 'programming', 'english'].map((org) => (
          <button
            key={org}
            onClick={() => setActiveTab(org)}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === org 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {org}
          </button>
        ))}
      </div>

      <DocumentationList 
        organizationId={currentOrg?.id}
        type={activeTab === 'all' ? undefined : activeTab}
        user={user}
      />
    </div>
  )
}
