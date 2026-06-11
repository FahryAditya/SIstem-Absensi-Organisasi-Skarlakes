import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Users, CheckCircle2, Wallet, TrendingUp } from 'lucide-react'

export default async function OrgDashboardPage({ params }: { params: { slug: string } }) {
  const org = await prisma.organization.findUnique({
    where: { slug: params.slug },
    include: {
      admins: {
        include: {
          user: {
            select: { id: true, nama: true, email: true }
          }
        }
      },
      _count: {
        select: {
          members: true,
          attendance: true,
          cash_transactions: true,
          admins: true
        }
      }
    }
  })

  if (!org) notFound()

  const stats = [
    { label: 'Total Anggota', value: org._count.members, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Total Absensi', value: org._count.attendance, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Transaksi Kas', value: org._count.cash_transactions, icon: Wallet, color: 'text-persian-blue', bg: 'bg-persian-blue/10' },
    { label: 'Admin Unit', value: org._count.admins, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg} ${s.color} mb-3`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</div>
            <div className="text-2xl font-black text-white font-mono mt-0.5">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">Informasi Unit</h3>
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-xs text-slate-400">Kategori</span>
              <span className="text-xs font-bold text-white">{org.category}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-xs text-slate-400">Asal Sekolah</span>
              <span className="text-xs font-bold text-white">{org.school_origin}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-xs text-slate-400">Administrator Unit</span>
              <div className="text-right">
                {org.admins.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {org.admins.map(a => (
                      <span key={a.id} className="text-xs font-bold text-persian-blue">{a.user.nama}</span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs font-bold text-slate-500 italic">Belum ditentukan</span>
                )}
              </div>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-xs text-slate-400">Status</span>
              <span className="text-xs font-bold text-green-500">{org.status}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-xs text-slate-400">Dibuat Pada</span>
              <span className="text-xs font-bold text-white">{new Date(org.created_at).toLocaleDateString('id-ID')}</span>
            </div>
          </div>
        </div>

        <div className="card p-6 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-persian-blue/10 flex items-center justify-center text-persian-blue">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-black text-white">System Ready</h4>
            <p className="text-xs text-slate-400 max-w-[200px] mt-1">
              Seluruh modul untuk {org.nama} telah aktif dan siap digunakan.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
