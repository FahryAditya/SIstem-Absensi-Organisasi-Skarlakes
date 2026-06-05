'use client'

import dynamic from 'next/dynamic'

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
const PieChart = dynamic<any>(() => import('recharts').then(mod => mod.PieChart) as any, { ssr: false })
const Pie = dynamic<any>(() => import('recharts').then(mod => mod.Pie) as any, { ssr: false })
const Cell = dynamic<any>(() => import('recharts').then(mod => mod.Cell) as any, { ssr: false })

interface AttendanceData {
  day?: string
  date?: string
  month?: string
  hadir: number
  tidak_hadir: number
  izin?: number
  sakit?: number
  alpa?: number
  persentase?: number
}

interface Props {
  data: {
    kehadiranMingguan?: AttendanceData[]
    kehadiranBulanan?: AttendanceData[]
    kehadiranTahunan?: AttendanceData[]
    kehadiranOrganisasi?: {
      osis?: { total: number; hadir: number; tidak_hadir: number }
      mpk?: { total: number; hadir: number; tidak_hadir: number }
    }
  }
}

const COLORS = ['#1E90FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export default function AttendanceCharts({ data }: Props) {
  return (
    <div className="space-y-6">
      {/* Weekly Attendance Chart */}
      {data.kehadiranMingguan && data.kehadiranMingguan.some(d => d.hadir + d.tidak_hadir > 0) && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-[#001F3F] mb-4">Kehadiran 7 Hari Terakhir</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.kehadiranMingguan} barSize={20} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="hadir" name="Hadir" fill="#1E90FF" radius={[4,4,0,0]} animationDuration={1000} />
              <Bar dataKey="tidak_hadir" name="Tidak Hadir" fill="#FCA5A5" radius={[4,4,0,0]} animationDuration={1000} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly Attendance Trend */}
      {data.kehadiranBulanan && data.kehadiranBulanan.some(d => d.hadir + d.tidak_hadir > 0) && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-[#001F3F] mb-4">Tren Kehadiran 30 Hari</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.kehadiranBulanan}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line 
                type="monotone" 
                dataKey="hadir" 
                name="Hadir" 
                stroke="#1E90FF" 
                strokeWidth={2.5} 
                dot={{ r: 3, fill: '#1E90FF' }}
                activeDot={{ r: 5 }}
                animationDuration={1500}
              />
              <Line 
                type="monotone" 
                dataKey="tidak_hadir" 
                name="Tidak Hadir" 
                stroke="#EF4444" 
                strokeWidth={2.5} 
                dot={{ r: 3, fill: '#EF4444' }}
                activeDot={{ r: 5 }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Yearly Attendance by Month */}
      {data.kehadiranTahunan && data.kehadiranTahunan.some(d => d.hadir + d.tidak_hadir > 0) && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-[#001F3F] mb-4">Kehadiran Tahunan per Bulan</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.kehadiranTahunan} barSize={24} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                formatter={(value: number, name: string) => [
                  name === 'persentase' ? `${value}%` : value,
                  name === 'persentase' ? 'Persentase' : name
                ]}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="hadir" name="Hadir" fill="#10B981" radius={[4,4,0,0]} animationDuration={1200} />
              <Bar dataKey="tidak_hadir" name="Tidak Hadir" fill="#EF4444" radius={[4,4,0,0]} animationDuration={1200} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Organization Attendance */}
      {data.kehadiranOrganisasi && (data.kehadiranOrganisasi.osis || data.kehadiranOrganisasi.mpk) && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-[#001F3F] mb-4">Kehadiran Organisasi (30 Hari)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.kehadiranOrganisasi.osis && (
              <div>
                <h4 className="text-xs font-semibold text-[#1E90FF] mb-3">OSIS</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Hadir', value: data.kehadiranOrganisasi.osis.hadir },
                        { name: 'Tidak Hadir', value: data.kehadiranOrganisasi.osis.tidak_hadir }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      animationDuration={1000}
                    >
                      <Cell fill="#1E90FF" />
                      <Cell fill="#FCA5A5" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center mt-2">
                  <span className="text-xs text-slate-400">Total: {data.kehadiranOrganisasi.osis.total}</span>
                </div>
              </div>
            )}
            {data.kehadiranOrganisasi.mpk && (
              <div>
                <h4 className="text-xs font-semibold text-[#1E90FF] mb-3">MPK</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Hadir', value: data.kehadiranOrganisasi.mpk.hadir },
                        { name: 'Tidak Hadir', value: data.kehadiranOrganisasi.mpk.tidak_hadir }
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
                      <Cell fill="#FCA5A5" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center mt-2">
                  <span className="text-xs text-slate-400">Total: {data.kehadiranOrganisasi.mpk.total}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
