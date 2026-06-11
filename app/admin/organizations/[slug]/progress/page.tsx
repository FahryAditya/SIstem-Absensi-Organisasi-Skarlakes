import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Trophy, TrendingUp, Award, Star } from 'lucide-react'
import Table from '@/components/ui/Table'

export default async function ProgressPage({ params }: { params: { slug: string } }) {
  const org = await prisma.organization.findUnique({
    where: { slug: params.slug },
    include: {
      members: {
        orderBy: [
          { level: 'desc' },
          { exp: 'desc' }
        ],
        take: 50
      }
    }
  })

  if (!org) notFound()

  const columns = [
    { key: 'rank', label: 'Rank', render: (_: any, idx: number) => (
      <span className="font-black text-slate-500 font-mono">#{idx + 1}</span>
    )},
    { key: 'name', label: 'Nama Anggota', render: (m: any) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-xs">
          {m.name.charAt(0).toUpperCase()}
        </div>
        <div className="font-bold text-white text-sm">{m.name}</div>
      </div>
    )},
    { key: 'level', label: 'Level', render: (m: any) => (
      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase">Lvl {m.level}</span>
    )},
    { key: 'exp', label: 'Total EXP', render: (m: any) => (
      <span className="text-xs font-bold text-white font-mono">{m.exp.toLocaleString()} XP</span>
    )},
    { key: 'progress', label: 'Progress Ke Level Berikutnya', render: (m: any) => (
      <div className="w-full max-w-[200px]">
        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1 uppercase">
          <span>{m.progress}%</span>
          <span>{m.level + 1}</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400" style={{ width: `${m.progress}%` }} />
        </div>
      </div>
    )}
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 border-l-4 border-amber-500 bg-amber-500/5">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            <Trophy className="w-3.5 h-3.5" /> Unit Leader
          </div>
          <div className="text-xl font-black text-white">{org.members[0]?.name || '-'}</div>
          <div className="text-[10px] text-amber-500 font-bold uppercase mt-1">Level {org.members[0]?.level || 0} Expert</div>
        </div>
        <div className="card p-5 border-l-4 border-blue-500 bg-blue-500/5">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            <TrendingUp className="w-3.5 h-3.5" /> Rata-Rata Level
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {org.members.length > 0 ? (org.members.reduce((acc, m) => acc + m.level, 0) / org.members.length).toFixed(1) : '0.0'}
          </div>
        </div>
        <div className="card p-5 border-l-4 border-green-500 bg-green-500/5">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            <Award className="w-3.5 h-3.5" /> Total XP Terkumpul
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {org.members.reduce((acc, m) => acc + m.exp, 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden border border-white/5">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Leaderboard Unit</h3>
          </div>
        </div>
        <Table 
          columns={columns} 
          data={org.members} 
          loading={false} 
          emptyMessage="Belum ada data progress anggota" 
          rowKey={(m: any) => m.id} 
        />
      </div>
    </div>
  )
}
