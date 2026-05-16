'use client'

import dynamic from 'next/dynamic'
import { formatCurrency } from '@/lib/utils'

// Lazy load Recharts components for better performance
const ResponsiveContainer = dynamic<any>(() => import('recharts').then(mod => mod.ResponsiveContainer) as any, { ssr: false })
const BarChart = dynamic<any>(() => import('recharts').then(mod => mod.BarChart) as any, { ssr: false })
const Bar = dynamic<any>(() => import('recharts').then(mod => mod.Bar) as any, { ssr: false })
const XAxis = dynamic<any>(() => import('recharts').then(mod => mod.XAxis) as any, { ssr: false })
const YAxis = dynamic<any>(() => import('recharts').then(mod => mod.YAxis) as any, { ssr: false })
const CartesianGrid = dynamic<any>(() => import('recharts').then(mod => mod.CartesianGrid) as any, { ssr: false })
const Tooltip = dynamic<any>(() => import('recharts').then(mod => mod.Tooltip) as any, { ssr: false })
const Legend = dynamic<any>(() => import('recharts').then(mod => mod.Legend) as any, { ssr: false })
const PieChart = dynamic<any>(() => import('recharts').then(mod => mod.PieChart) as any, { ssr: false })
const Pie = dynamic<any>(() => import('recharts').then(mod => mod.Pie) as any, { ssr: false })
const Cell = dynamic<any>(() => import('recharts').then(mod => mod.Cell) as any, { ssr: false })

interface SiswaKasData {
  nama: string
  kelas: string
  total_kas: number
  organisasi: string
}

interface DistributionData {
  range: string
  count: number
}

interface Props {
  data: {
    kasSiswa: {
      programming?: SiswaKasData[]
      english?: SiswaKasData[]
      osis?: SiswaKasData[]
      mpk?: SiswaKasData[]
    }
    kasDistribution?: DistributionData[]
  }
  activeOrg?: string
}

const COLORS = ['#5482B4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function KasSiswaCharts({ data, activeOrg }: Props) {
  const orgData = activeOrg && data.kasSiswa[activeOrg as keyof typeof data.kasSiswa] 
    ? data.kasSiswa[activeOrg as keyof typeof data.kasSiswa] 
    : []

  return (
    <div className="space-y-6">
      {/* Top 20 Kas Siswa by Organization */}
      {orgData && orgData.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-[#011025] mb-4">Top 20 Kas Siswa - {activeOrg?.toUpperCase() || 'Semua'}</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={orgData} barSize={24} barGap={4} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => v >= 1000000 ? `${(v/1000000).toFixed(1)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
              />
              <YAxis dataKey="nama" type="category" width={120} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                formatter={(value: number) => [formatCurrency(value), 'Total Kas']}
                labelFormatter={(label: string) => {
                  const item = orgData.find((d: any) => d.nama === label)
                  return item ? `${label} (${item.kelas})` : label
                }}
              />
              <Bar dataKey="total_kas" name="Total Kas" fill="#5482B4" radius={[0,4,4,0]} animationDuration={1200} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Kas Distribution by Range */}
      {data.kasDistribution && data.kasDistribution.some(d => d.count > 0) && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-[#011025] mb-4">Distribusi Kas Siswa</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data.kasDistribution.filter(d => d.count > 0)}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="count"
                animationDuration={1000}
                label={({ range, count, percent }: any) => `${range}: ${count} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {data.kasDistribution.filter(d => d.count > 0).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value} siswa`, 'Jumlah']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Comparison by Organization */}
      {(data.kasSiswa.programming?.length || data.kasSiswa.english?.length || data.kasSiswa.osis?.length || data.kasSiswa.mpk?.length) && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-[#011025] mb-4">Rata-rata Kas per Organisasi</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
              { name: 'Programming', avg: data.kasSiswa.programming?.length ? Math.round(data.kasSiswa.programming.reduce((s, d) => s + d.total_kas, 0) / data.kasSiswa.programming.length) : 0 },
              { name: 'English', avg: data.kasSiswa.english?.length ? Math.round(data.kasSiswa.english.reduce((s, d) => s + d.total_kas, 0) / data.kasSiswa.english.length) : 0 },
              { name: 'OSIS', avg: data.kasSiswa.osis?.length ? Math.round(data.kasSiswa.osis.reduce((s, d) => s + d.total_kas, 0) / data.kasSiswa.osis.length) : 0 },
              { name: 'MPK', avg: data.kasSiswa.mpk?.length ? Math.round(data.kasSiswa.mpk.reduce((s, d) => s + d.total_kas, 0) / data.kasSiswa.mpk.length) : 0 },
            ].filter(d => d.avg > 0)} barSize={50} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => v >= 1000000 ? `${(v/1000000).toFixed(1)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
              />
              <Tooltip 
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                formatter={(value: number) => [formatCurrency(value), 'Rata-rata']}
              />
              <Bar dataKey="avg" name="Rata-rata Kas" fill="#10B981" radius={[4,4,0,0]} animationDuration={1000} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
