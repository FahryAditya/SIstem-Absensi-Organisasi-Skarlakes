'use client'

import React, { useState, useEffect } from 'react'
import { getAccessibleOrgs } from '@/lib/auth-shared'
import DocumentationList from '@/components/documentation/DocumentationList'
import { useRouter } from 'next/navigation'
import { Camera, LayoutDashboard, Plus } from 'lucide-react'

interface Props {
  user: any
}

export default function DashboardDokumentasiClient({ user }: Props) {
  const router = useRouter()
  const accessibleOrgs = getAccessibleOrgs(user.role)
  const [activeTab, setActiveTab] = useState(accessibleOrgs[0] || 'osis')
  const [organizations, setOrganizations] = useState<any[]>([])

  useEffect(() => {
    const fetchOrgs = async () => {
      const res = await fetch('/api/organizations') // I need to create this API too
      const data = await res.json()
      if (res.ok) {
        setOrganizations(data.data)
      }
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
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Dokumentasi</h1>
            <p className="text-sm text-slate-400 font-medium">Kelola galeri kegiatan dan dokumentasi organisasi Anda.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        {accessibleOrgs.map((org) => (
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
        type={activeTab}
        user={user}
        onAddClick={() => router.push(`/dashboard/dokumentasi/tambah?org=${activeTab}`)}
        onEditClick={(doc) => router.push(`/dashboard/dokumentasi/${doc.id}/edit`)}
      />
    </div>
  )
}
