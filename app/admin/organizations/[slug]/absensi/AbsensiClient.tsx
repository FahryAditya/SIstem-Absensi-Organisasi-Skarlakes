'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import Table from '@/components/ui/Table'
import { Calendar, Save, CheckCircle2, XCircle, Clock, Wallet, Loader2 } from 'lucide-react'
import Select from '@/components/ui/Select'
import { clearJsonCache, fetchJsonCachedUrl } from '@/lib/client-cache'

interface MemberData {
  id: number
  name: string
  nis: string | null
}

interface AttendanceData {
  member_id: number
  attendance_status: string
  cash_amount: number
  notes: string | null
}

interface Props {
  slug: string
}

export default function AbsensiClient({ slug }: Props) {
  const [members, setMembers] = useState<MemberData[]>([])
  const [attendance, setAttendance] = useState<Record<number, AttendanceData>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const load = useCallback(async () => {
    setLoading(true)
    const [mJson, aJson] = await Promise.all([
      fetchJsonCachedUrl<{ data?: MemberData[] }>(`/api/organizations/${slug}/members`),
      fetchJsonCachedUrl<{ data?: any[] }>(`/api/organizations/${slug}/attendance?date=${date}`)
    ])
    
    setMembers(mJson.data || [])
    
    const attMap: Record<number, AttendanceData> = {}
    ;(aJson.data || []).forEach((a: any) => {
      attMap[a.member_id] = {
        member_id: a.member_id,
        attendance_status: a.attendance_status,
        cash_amount: a.cash_amount,
        notes: a.notes
      }
    })
    setAttendance(attMap)
    setLoading(false)
  }, [slug, date])

  useEffect(() => { load() }, [load])

  const updateStatus = (memberId: number, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [memberId]: {
        ...(prev[memberId] || { member_id: memberId, cash_amount: 0, notes: '' }),
        attendance_status: status
      }
    }))
  }

  const updateCash = (memberId: number, amount: string) => {
    setAttendance(prev => ({
      ...prev,
      [memberId]: {
        ...(prev[memberId] || { member_id: memberId, attendance_status: 'Hadir', notes: '' }),
        cash_amount: parseInt(amount) || 0
      }
    }))
  }

  async function handleSaveAll() {
    setSaving(true)
    try {
      const promises = Object.values(attendance).map(a => 
        fetch(`/api/organizations/${slug}/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...a, date })
        })
      )
      await Promise.all(promises)
      toast.success('Absensi berhasil disimpan')
      clearJsonCache()
      load()
    } catch (e) {
      toast.error('Gagal menyimpan absensi')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'name', label: 'Nama Anggota', render: (m: MemberData) => (
      <div className="flex flex-col">
        <span className="text-sm font-bold text-white">{m.name}</span>
        <span className="text-[10px] text-slate-400 font-mono">{m.nis || '-'}</span>
      </div>
    )},
    { key: 'status', label: 'Status Kehadiran', render: (m: MemberData) => (
      <div className="flex gap-2">
        {['Hadir', 'Izin', 'Sakit', 'Alpha'].map(s => (
          <button
            key={s}
            onClick={() => updateStatus(m.id, s)}
            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
              attendance[m.id]?.attendance_status === s 
                ? 'bg-persian-blue text-white ring-2 ring-persian-blue/20' 
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    )},
    { key: 'cash', label: 'Iuran Kas (Rp)', render: (m: MemberData) => (
      <div className="flex items-center gap-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">Rp</span>
          <input 
            type="number"
            value={attendance[m.id]?.cash_amount || ''}
            onChange={e => updateCash(m.id, e.target.value)}
            placeholder="0"
            className="input pl-8 h-8 w-24 text-right text-xs"
          />
        </div>
      </div>
    )}
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="input pl-10 h-10 w-44" 
            />
          </div>
          <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400">
            {members.length} Anggota
          </div>
        </div>
        <button 
          onClick={handleSaveAll}
          disabled={saving || loading}
          className="btn-primary h-10"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Absensi & Kas
        </button>
      </div>

      <Table 
        columns={columns} 
        data={members} 
        loading={loading} 
        emptyMessage="Belum ada anggota di unit ini" 
        rowKey={(m: MemberData) => m.id} 
      />
    </div>
  )
}
