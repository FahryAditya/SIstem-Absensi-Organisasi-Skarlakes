'use client'

import { useEffect, useState, useCallback } from 'react'
import { Mail, ArrowLeft, History } from 'lucide-react'
import { SessionUser, getAccessibleOrgs } from '@/lib/auth-shared'
import SendEmailForm from '@/components/admin/SendEmailForm'
import Link from 'next/link'

interface AdminEmailClientProps {
  user: SessionUser
}

const ORG_OPTIONS = [
  { id: 'programming', label: 'Programming' },
  { id: 'english', label: 'English Club' },
  { id: 'osis', label: 'OSIS' },
  { id: 'mpk', label: 'MPK' },
]

export default function AdminEmailClient({ user }: AdminEmailClientProps) {
  const allowedOrgs = getAccessibleOrgs(user.role)
  const [activeOrg, setActiveOrg] = useState(allowedOrgs[0] || 'programming')
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  const loadMembers = useCallback(async (org: string) => {
    setLoadingMembers(true)
    try {
      const url = org === 'programming' || org === 'english'
        ? `/api/siswa?ekskul=${org}&limit=200`
        : `/api/organisasi?tipe=${org}&limit=200`
      const res = await fetch(url)
      const json = await res.json()
      setMembers(json.data || [])
    } catch {
      setMembers([])
    } finally {
      setLoadingMembers(false)
    }
  }, [])

  useEffect(() => {
    if (activeOrg) {
      loadMembers(activeOrg)
    }
  }, [activeOrg, loadMembers])

  return (
    <div className="space-y-6">
      {/* Back button and history link */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-royal-400 hover:text-royal-900 text-sm transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
        </Link>
        <Link
          href="/admin/email/history"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cream-100 border border-royal-200 text-sm font-semibold text-royal-600 hover:bg-cream-200 hover:text-royal-900 transition-all"
        >
          <History className="w-4 h-4" />
          Lihat Riwayat Kirim
        </Link>
      </div>

      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-cream-100 rounded-2xl text-royal-500">
          <Mail className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-royal-900">Kirim Notifikasi Email</h1>
          <p className="text-royal-400 text-sm">Kirim email undangan pertemuan/rapat otomatis ke anggota organisasi</p>
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

      {/* Send Email Form Container */}
      <div className="bg-royal-950 border border-white/10 rounded-2xl p-6 shadow-xl max-w-3xl">
        {loadingMembers ? (
          <div className="py-20 text-center text-royal-400">
            <div className="w-6 h-6 border-2 border-royal-500 border-t-white rounded-full animate-spin mx-auto mb-3" />
            Memuat data anggota...
          </div>
        ) : (
          <SendEmailForm organizationType={activeOrg} members={members} />
        )}
      </div>
    </div>
  )
}
