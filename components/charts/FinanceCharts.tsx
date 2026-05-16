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
const LineChart = dynamic<any>(() => import('recharts').then(mod => mod.LineChart) as any, { ssr: false })
const Line = dynamic<any>(() => import('recharts').then(mod => mod.Line) as any, { ssr: false })
const AreaChart = dynamic<any>(() => import('recharts').then(mod => mod.AreaChart) as any, { ssr: false })
const Area = dynamic<any>(() => import('recharts').then(mod => mod.Area) as any, { ssr: false })
const PieChart = dynamic<any>(() => import('recharts').then(mod => mod.PieChart) as any, { ssr: false })
const Pie = dynamic<any>(() => import('recharts').then(mod => mod.Pie) as any, { ssr: false })
const Cell = dynamic<any>(() => import('recharts').then(mod => mod.Cell) as any, { ssr: false })

interface FinanceData {
  bulan: string
  pemasukan: number
  pengeluaran: number
  saldo: number
}

interface OrgFinance {
  pemasukan: number
  pengeluaran: number
  saldo: number
}

interface Props {
  data: {
    keuanganBulanan?: FinanceData[]
    keuanganTahunan?: FinanceData[]
    keuanganOrganisasi?: {
      osis?: OrgFinance
      mpk?: OrgFinance
    }
  }
}

const COLORS = ['#10B981', '#EF4444', '#5482B4']

export default function FinanceCharts({ data }: Props) {
  return (
    <div className="space-y-6">
      {/* Monthly Finance Chart */}
      {data.keuanganBulanan && data.keuanganBulanan.some(d => d.pemasukan + d.pengeluaran > 0) && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-[#011025] mb-4">Keuangan 6 Bulan Terakhir</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.keuanganBulanan} barSize={28} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => v >= 1000000 ? `${(v/1000000).toFixed(1)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
              />
              <Tooltip 
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                formatter={(value: number) => [formatCurrency(value), '']}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="pemasukan" name="Pemasukan" fill="#10B981" radius={[4,4,0,0]} animationDuration={1000} />
              <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#EF4444" radius={[4,4,0,0]} animationDuration={1000} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly Balance Trend */}
      {data.keuanganBulanan && data.keuanganBulanan.some(d => d.saldo !== 0) && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-[#011025] mb-4">Tren Saldo Kas 6 Bulan</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data.keuanganBulanan}>
              <defs>
                <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5482B4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#5482B4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => v >= 1000000 ? `${(v/1000000).toFixed(1)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
              />
              <Tooltip 
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                formatter={(value: number) => [formatCurrency(value), 'Saldo']}
              />
              <Area 
                type="monotone" 
                dataKey="saldo" 
                stroke="#5482B4" 
                strokeWidth={2.5}
                fill="url(#saldoGrad)" 
                dot={{ r: 4, fill: '#5482B4', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Yearly Finance Chart */}
      {data.keuanganTahunan && data.keuanganTahunan.some(d => d.pemasukan + d.pengeluaran > 0) && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-[#011025] mb-4">Keuangan Tahunan</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.keuanganTahunan}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => v >= 1000000 ? `${(v/1000000).toFixed(1)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
              />
              <Tooltip 
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                formatter={(value: number) => [formatCurrency(value), '']}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line 
                type="monotone" 
                dataKey="pemasukan" 
                name="Pemasukan" 
                stroke="#10B981" 
                strokeWidth={2.5} 
                dot={{ r: 3, fill: '#10B981' }}
                activeDot={{ r: 5 }}
                animationDuration={1500}
              />
              <Line 
                type="monotone" 
                dataKey="pengeluaran" 
                name="Pengeluaran" 
                stroke="#EF4444" 
                strokeWidth={2.5} 
                dot={{ r: 3, fill: '#EF4444' }}
                activeDot={{ r: 5 }}
                animationDuration={1500}
              />
              <Line 
                type="monotone" 
                dataKey="saldo" 
                name="Saldo" 
                stroke="#5482B4" 
                strokeWidth={2.5} 
                dot={{ r: 3, fill: '#5482B4' }}
                activeDot={{ r: 5 }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Organization Finance */}
      {data.keuanganOrganisasi && (data.keuanganOrganisasi.osis || data.keuanganOrganisasi.mpk) && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-[#011025] mb-4">Keuangan Organisasi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.keuanganOrganisasi.osis && (
              <div>
                <h4 className="text-xs font-semibold text-[#5482B4] mb-3">OSIS</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Saldo', value: data.keuanganOrganisasi.osis.saldo },
                        { name: 'Pengeluaran', value: data.keuanganOrganisasi.osis.pengeluaran }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      animationDuration={1000}
                    >
                      <Cell fill="#5482B4" />
                      <Cell fill="#EF4444" />
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center mt-2 space-y-1">
                  <div className="text-xs text-slate-500">Pemasukan: {formatCurrency(data.keuanganOrganisasi.osis.pemasukan)}</div>
                  <div className="text-xs text-slate-500">Saldo: {formatCurrency(data.keuanganOrganisasi.osis.saldo)}</div>
                </div>
              </div>
            )}
            {data.keuanganOrganisasi.mpk && (
              <div>
                <h4 className="text-xs font-semibold text-[#5482B4] mb-3">MPK</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Saldo', value: data.keuanganOrganisasi.mpk.saldo },
                        { name: 'Pengeluaran', value: data.keuanganOrganisasi.mpk.pengeluaran }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      animationDuration={1000}
                    >
                      <Cell fill="#10B981" />
                      <Cell fill="#EF4444" />
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center mt-2 space-y-1">
                  <div className="text-xs text-slate-500">Pemasukan: {formatCurrency(data.keuanganOrganisasi.mpk.pemasukan)}</div>
                  <div className="text-xs text-slate-500">Saldo: {formatCurrency(data.keuanganOrganisasi.mpk.saldo)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
