'use client'

import { useState } from 'react'
import { History, ArrowLeft } from 'lucide-react'
import { SessionUser, getAccessibleOrgs } from '@/lib/auth-shared'
import EmailHistoryTable from '@/components/admin/EmailHistoryTable'
import Link from 'next/link'

interface AdminEmailHistoryClientProps {
  user: SessionUser
}

const ORG_OPTIONS = [
  { id: 'programming', label: 'Programming' },
  { id: 'english', label: 'English Club' },
  { id: 'osis', label: 'OSIS' },
  { id: 'mpk', label: 'MPK' },
]

export default function AdminEmailHistoryClient({ user }: AdminEmailHistoryClientProps) {
  const allowedOrgs = getAccessibleOrgs(user.role)
  const [activeOrg, setActiveOrg] = useState(allowedOrgs[0] || 'programming')

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link href="/admin/email" className="flex items-center gap-2 text-royal-400 hover:text-royal-900 text-sm transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Form Kirim
        </Link>
      </div>

      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-cream-100 rounded-2xl text-royal-500">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-royal-900">Riwayat Pengiriman Email</h1>
          <p className="text-royal-400 text-sm">Lihat log pengiriman notifikasi email yang berhasil atau gagal</p>
        </div>
      </div>

      {/* Tabs */}
      {allowedOrgs.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {ORG_OPTIONS.filter(o => allowedOrgs.includes(o.id)).map(org => (
            <button
              key={org.id}
              onClick={() => setActiveOrg(org.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                activeOrg === org.id
                  ? 'bg-gradient-to-r from-royal-500 to-royal-600 text-white border-transparent'
                  : 'bg-cream-100 border-royal-200 text-royal-500 hover:bg-cream-200'
              }`}
            >
              {org.label}
            </button>
          ))}
        </div>
      )}

      {/* Email History Table */}
      <div className="bg-royal-950 border border-white/10 rounded-2xl p-6 shadow-xl">
        <EmailHistoryTable organizationType={activeOrg} />
      </div>
    </div>
  )
}
