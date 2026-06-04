'use client'

import React, { useState } from 'react'
import { Camera, Plus, X } from 'lucide-react'
import DocumentationList from '@/components/documentation/DocumentationList'
import DocumentationForm from '@/components/documentation/DocumentationForm'
import { getAccessibleOrgs } from '@/lib/auth-shared'
import { createPortal } from 'react-dom'

interface Props {
  user: any
}

// Static org map — no API fetch needed
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

export default function DokumentasiClient({ user }: Props) {
  const accessibleOrgs = getAccessibleOrgs(user.role)
  const [activeTab, setActiveTab] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const canAdd = ['administrator', 'admin_programming', 'admin_english', 'admin_osis_mpk'].includes(user.role)

  // Determine which org to use for the modal
  const modalOrgType = activeTab === 'all' ? (accessibleOrgs[0] || 'osis') : activeTab
  const modalOrg = ORG_MAP[modalOrgType] || ORG_MAP['osis']

  const currentOrgId = activeTab !== 'all' ? ORG_MAP[activeTab]?.id : undefined

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
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
            onClick={() => setShowAddModal(true)}
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
        key={refreshKey}
        organizationId={currentOrgId}
        type={activeTab === 'all' ? undefined : activeTab}
        user={user}
      />

      {/* Add Modal */}
      {showAddModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative border border-slate-100">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md px-8 py-5 border-b border-slate-100 z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100">
                  <Camera className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">Tambah Dokumentasi</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Unit: {ORG_LABELS[modalOrgType] || modalOrgType}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Modal Body — renders immediately, no loading needed */}
            <div className="p-8">
              <DocumentationForm
                organizationId={modalOrg.id}
                type={modalOrgType as any}
                onSubmitSuccess={() => {
                  setShowAddModal(false)
                  setRefreshKey(prev => prev + 1)
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
