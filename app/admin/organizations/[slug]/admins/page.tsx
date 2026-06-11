import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ShieldCheck, UserPlus, Trash2, Mail, Shield } from 'lucide-react'
import Table from '@/components/ui/Table'
import { RoleBadge } from '@/components/ui/Badges'

export default async function OrgAdminsPage({ params }: { params: { slug: string } }) {
  const org = await prisma.organization.findUnique({
    where: { slug: params.slug },
    include: {
      admins: {
        include: {
          user: true
        }
      }
    }
  })

  if (!org) notFound()

  const columns = [
    { key: 'nama', label: 'Nama Administrator', render: (a: any) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold text-xs">
          {a.user.nama.charAt(0).toUpperCase()}
        </div>
        <div className="font-bold text-white text-sm">{a.user.nama}</div>
      </div>
    )},
    { key: 'email', label: 'Email', render: (a: any) => (
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
        <Mail className="w-3.5 h-3.5" />
        {a.user.email}
      </div>
    )},
    { key: 'role', label: 'System Role', render: (a: any) => <RoleBadge role={a.user.role} /> },
    { key: 'actions', label: '', render: (a: any) => (
      <button className="btn-icon text-red-400 hover:bg-red-500/10">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    )}
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            Administrator Unit
          </h2>
          <p className="text-xs text-slate-400 mt-1">Kelola user yang memiliki akses penuh ke unit {org.nama}</p>
        </div>
        <button className="btn-primary">
          <UserPlus className="w-4 h-4" />
          Assign Admin Baru
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Table 
            columns={columns} 
            data={org.admins} 
            loading={false} 
            emptyMessage="Belum ada administrator yang ditugaskan ke unit ini" 
            rowKey={(a: any) => a.id} 
          />
        </div>

        <div className="space-y-4">
          <div className="card p-5 bg-indigo-500/5 border border-indigo-500/10">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs mb-3 uppercase tracking-wider">
              <Shield className="w-4 h-4" /> Informasi Akses
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Administrator Unit memiliki izin untuk:
            </p>
            <ul className="mt-3 space-y-2 text-[11px] text-slate-300">
              <li className="flex items-center gap-2">• Mengelola database anggota</li>
              <li className="flex items-center gap-2">• Mencatat absensi & kas harian</li>
              <li className="flex items-center gap-2">• Mengatur profil & jadwal unit</li>
              <li className="flex items-center gap-2">• Memberikan poin/XP ke anggota</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
