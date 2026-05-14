'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatDateTime } from '@/lib/utils'
import { isAdministrator } from '@/lib/auth-shared'
import {
  CalendarClock, CheckCircle2, Clock, Download, Loader2, MessageSquareText,
  Play, Plus, QrCode, Save, Send, ShieldCheck, SquarePen, Users, XCircle
} from 'lucide-react'

type Org = 'osis' | 'mpk'
type SessionStatus = 'SCHEDULED' | 'ACTIVE' | 'SELESAI' | 'DIBATALKAN'
type QueueStatus = 'MENUNGGU' | 'WAWANCARA' | 'SELESAI_WAWANCARA'
type ScanValidation = 'SAH' | 'SAH_DICURIGAI' | 'DITOLAK_VPN' | 'TIDAK_SAH'
type IpStatus = 'NORMAL' | 'VPN_INDONESIA' | 'VPN_LUAR_NEGERI' | 'TIDAK_DIKETAHUI'

interface InterviewResult {
  id: number
  keterangan: 'AKTIF' | 'KURANG_AKTIF'
  hasil: 'LOLOS' | 'TIDAK_LOLOS'
  persentase: number
  catatan: string | null
  override_alasan: string | null
  override_at: string | null
  interviewer?: { nama: string }
  overrider?: { nama: string }
}

interface QueueItem {
  id: number
  nama: string
  kelas: string
  nomor_antrian: number
  status: QueueStatus
  scan_token: string | null
  ip_address: string | null
  ip_country: string | null
  ip_isp: string | null
  ip_status: IpStatus
  gps_lat: number | null
  gps_lng: number | null
  jarak_meter: number | null
  status_validasi: ScanValidation
  alasan_validasi: string | null
  created_at: string
  hasil_wawancara: InterviewResult | null
}

interface InterviewSession {
  id: number
  organisasi_type: Org
  status: SessionStatus
  jadwal_mulai: string | null
  jadwal_selesai: string | null
  finalized_at: string | null
  locked_at: string | null
  antrian: QueueItem[]
}

interface ChatMessage {
  id: number
  pesan: string
  created_at: string
  sender: { id: number; nama: string; role: string }
}

interface Props {
  user: { id: number; nama: string; email: string; role: string }
}

const statusStyle: Record<SessionStatus, string> = {
  SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200',
  ACTIVE: 'bg-green-50 text-green-700 border-green-200',
  SELESAI: 'bg-slate-100 text-slate-700 border-slate-200',
  DIBATALKAN: 'bg-red-50 text-red-700 border-red-200',
}

const queueLabel: Record<QueueStatus, string> = {
  MENUNGGU: 'Menunggu',
  WAWANCARA: 'Wawancara',
  SELESAI_WAWANCARA: 'Selesai',
}

const resultLabel = {
  AKTIF: 'Aktif',
  KURANG_AKTIF: 'Kurang Aktif',
  LOLOS: 'Lolos',
  TIDAK_LOLOS: 'Tidak Lolos',
}

const orgLabelMap: Record<Org, string> = {
  osis: 'OSIS',
  mpk: 'MPK',
}

const validationLabel: Record<ScanValidation, string> = {
  SAH: 'Sah',
  SAH_DICURIGAI: 'Sah + Flag',
  DITOLAK_VPN: 'Ditolak VPN',
  TIDAK_SAH: 'Tidak Sah',
}

const validationStyle: Record<ScanValidation, string> = {
  SAH: 'bg-green-50 text-green-700 border-green-200',
  SAH_DICURIGAI: 'bg-amber-50 text-amber-700 border-amber-200',
  DITOLAK_VPN: 'bg-red-50 text-red-700 border-red-200',
  TIDAK_SAH: 'bg-slate-100 text-slate-700 border-slate-200',
}

const SESSION_POLL_MS = 15_000
const CHAT_POLL_MS = 8_000

function datetimeLocalValue(value: string | null) {
  if (!value) return ''
  const d = new Date(value)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export default function WawancaraClient({ user }: Props) {
  const [org, setOrg] = useState<'all' | Org>('all')
  const [sessions, setSessions] = useState<InterviewSession[]>([])
  const [hasilFilter, setHasilFilter] = useState('')
  const [validasiFilter, setValidasiFilter] = useState('')
  const [kelasFilter, setKelasFilter] = useState('')
  const [kelasDraft, setKelasDraft] = useState('')
  const [chats, setChats] = useState<ChatMessage[]>([])
  const [chatText, setChatText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sessionModal, setSessionModal] = useState(false)
  const [resultModal, setResultModal] = useState(false)
  const [overrideModal, setOverrideModal] = useState(false)
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ id: number; action: 'finish' | 'cancel'; title: string; message: string } | null>(null)
  const [targetQueue, setTargetQueue] = useState<QueueItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [fMulai, setFMulai] = useState('')
  const [fSelesai, setFSelesai] = useState('')
  const [fOrg, setFOrg] = useState<Org>('osis')
  const [fKet, setFKet] = useState<'AKTIF' | 'KURANG_AKTIF'>('AKTIF')
  const [fHasil, setFHasil] = useState<'LOLOS' | 'TIDAK_LOLOS'>('LOLOS')
  const [fPersen, setFPersen] = useState(80)
  const [fCatatan, setFCatatan] = useState('')
  const [overrideTarget, setOverrideTarget] = useState<QueueItem | null>(null)
  const [overrideReason, setOverrideReason] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const loadedOnce = useRef(false)
  const chatLastId = useRef(0)
  const warned10 = useRef<number | null>(null)
  const warned5 = useRef<number | null>(null)

  const admin = isAdministrator(user.role)

  useEffect(() => {
    const id = setTimeout(() => setKelasFilter(kelasDraft.trim()), 500)
    return () => clearTimeout(id)
  }, [kelasDraft])

  const load = useCallback(async (force = false) => {
    if (!loadedOnce.current) setLoading(true)
    const params = new URLSearchParams({
      org,
      ...(hasilFilter && { hasil: hasilFilter }),
      ...(validasiFilter && { validasi: validasiFilter }),
      ...(kelasFilter && { kelas: kelasFilter }),
      ...(force && { refresh: '1' }),
    })
    const res = await fetch(`/api/wawancara?${params}`)
    const json = await res.json()
    setSessions(json.data || [])
    loadedOnce.current = true
    setLoading(false)
  }, [org, hasilFilter, validasiFilter, kelasFilter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') load()
    }
    const id = setInterval(tick, SESSION_POLL_MS)
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('focus', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
      window.removeEventListener('focus', tick)
    }
  }, [load])

  const activeSession = sessions.find((s) => s.status === 'ACTIVE')
  const selectedSession = activeSession || sessions[0]

  useEffect(() => {
    if (selectedSession?.status === 'ACTIVE' && selectedSession.jadwal_selesai) {
      const msLeft = new Date(selectedSession.jadwal_selesai).getTime() - currentTime.getTime()
      if (msLeft > 0) {
        if (msLeft <= 10 * 60 * 1000 && msLeft > 9.9 * 60 * 1000 && warned10.current !== selectedSession.id) {
          toast('Peringatan: 10 menit lagi sesi wawancara akan berakhir!', { icon: '⏳', duration: 8000 })
          warned10.current = selectedSession.id
        }
        if (msLeft <= 5 * 60 * 1000 && msLeft > 4.9 * 60 * 1000 && warned5.current !== selectedSession.id) {
          toast('Peringatan: 5 menit lagi sesi wawancara selesai!', { icon: '⚠️', duration: 8000 })
          warned5.current = selectedSession.id
        }
      }
    }
  }, [currentTime, selectedSession])

  const loadChat = useCallback(async () => {
    if (!activeSession) { setChats([]); return }
    const lastId = chatLastId.current
    const params = new URLSearchParams({
      sesiId: activeSession.id.toString(),
      ...(lastId && { sinceId: lastId.toString() }),
    })
    const res = await fetch(`/api/wawancara/chat?${params}`)
    const json = await res.json().catch(() => ({}))
    if (res.ok) {
      const incoming = json.data || []
      if (incoming.length) chatLastId.current = incoming[incoming.length - 1].id
      setChats((prev) => lastId ? [...prev, ...incoming] : incoming)
    }
  }, [activeSession])

  useEffect(() => {
    chatLastId.current = 0
    setChats([])
  }, [activeSession?.id])

  useEffect(() => { loadChat() }, [loadChat])
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') loadChat()
    }
    const id = setInterval(tick, CHAT_POLL_MS)
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('focus', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
      window.removeEventListener('focus', tick)
    }
  }, [loadChat])

  function openCreate() {
    setEditingSessionId(null)
    setFOrg('osis')
    setFMulai(datetimeLocalValue(new Date().toISOString()))
    setFSelesai('')
    setSessionModal(true)
  }

  function openEdit(session: InterviewSession) {
    setEditingSessionId(session.id)
    setFOrg(session.organisasi_type)
    setFMulai(datetimeLocalValue(session.jadwal_mulai))
    setFSelesai(datetimeLocalValue(session.jadwal_selesai))
    setSessionModal(true)
  }

  function openOverride(q: QueueItem) {
    setOverrideTarget(q)
    setOverrideReason('')
    setOverrideModal(true)
  }

  function openResult(q: QueueItem) {
    setTargetQueue(q)
    setFKet(q.hasil_wawancara?.keterangan || 'AKTIF')
    setFHasil(q.hasil_wawancara?.hasil || 'LOLOS')
    setFPersen(q.hasil_wawancara?.persentase || 80)
    setFCatatan(q.hasil_wawancara?.catatan || '')
    setResultModal(true)
  }

  async function saveSession() {
    setSaving(true)
    const url = '/api/wawancara'
    const method = editingSessionId ? 'PUT' : 'POST'
    const body = {
      ...(editingSessionId && { id: editingSessionId }),
      ...(!editingSessionId && { organisasi_type: fOrg }),
      jadwal_mulai: fMulai ? new Date(fMulai).toISOString() : null,
      jadwal_selesai: fSelesai ? new Date(fSelesai).toISOString() : null,
    }
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error || `Gagal ${editingSessionId ? 'mengubah' : 'membuat'} sesi`)
      setSaving(false)
      return
    }
    toast.success(editingSessionId ? 'Jadwal wawancara diubah' : (json.data.status === 'ACTIVE' ? 'Wawancara aktif' : 'Jadwal wawancara dibuat'))
    setSaving(false)
    setSessionModal(false)
    load(true)
  }

  async function updateSession(id: number, action: 'activate' | 'finish' | 'cancel') {
    setSaving(true)
    const res = await fetch('/api/wawancara', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    })
    const json = await res.json()
    if (!res.ok) toast.error(json.error || 'Gagal mengubah sesi')
    else toast.success(action === 'activate' ? 'Sesi diaktifkan' : action === 'finish' ? 'Hasil difinalisasi dan data dikunci' : 'Sesi dibatalkan')
    setSaving(false)
    setConfirmAction(null)
    load(true)
  }

  async function setQueueStatus(id: number, status: QueueStatus) {
    const res = await fetch('/api/wawancara/antrian', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    const json = await res.json()
    if (!res.ok) toast.error(json.error || 'Gagal mengubah status antrian')
    else load(true)
  }

  async function saveResult() {
    if (!targetQueue) return
    setSaving(true)
    const res = await fetch('/api/wawancara/hasil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        antrian_id: targetQueue.id,
        keterangan: fKet,
        hasil: fHasil,
        persentase: Number(fPersen),
        catatan: fCatatan || null,
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error || 'Gagal menyimpan hasil')
      setSaving(false)
      return
    }
    toast.success('Hasil wawancara tersimpan')
    setSaving(false)
    setResultModal(false)
    load(true)
  }

  async function downloadExport(sessionId: number) {
    window.open(`/api/wawancara/export?sesiId=${sessionId}`, '_blank')
  }

  async function sendChat() {
    if (!activeSession || !chatText.trim()) return
    const message = chatText.trim()
    setChatText('')
    const res = await fetch('/api/wawancara/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sesi_id: activeSession.id, pesan: message }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) toast.error(json.error || 'Gagal mengirim chat')
    else {
      chatLastId.current = json.data.id
      setChats((prev) => [...prev, json.data])
    }
  }

  async function saveOverride() {
    if (!overrideTarget?.hasil_wawancara) return
    if (!overrideReason.trim()) { toast.error('Alasan override wajib diisi'); return }
    setSaving(true)
    const res = await fetch('/api/wawancara/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hasil_id: overrideTarget.hasil_wawancara.id, alasan: overrideReason.trim() }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) toast.error(json.error || 'Gagal override hasil')
    else {
      toast.success('Hasil berhasil dioverride menjadi Lolos')
      setOverrideModal(false)
      load(true)
    }
    setSaving(false)
  }

  const orgLabel = org === 'all' ? 'OSIS & MPK' : orgLabelMap[org]
  const queue = sessions.flatMap((s) => s.antrian.map((q) => ({ ...q, sesiOrg: s.organisasi_type, sesiStatus: s.status })))
  const done = queue.filter((q) => q.hasil_wawancara).length
  const scanCounts = queue.reduce<Record<string, number>>((acc, q) => {
    const key = `${q.nama.trim().toLowerCase()}|${q.kelas.trim().toLowerCase()}`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  function noteFor(q: QueueItem & { sesiOrg?: Org }) {
    const notes: string[] = []
    if (q.hasil_wawancara?.override_at) {
      notes.push(`Override: ${q.hasil_wawancara.override_alasan || 'Pertimbangan Pembina'}`)
    }
    const scanKey = `${q.nama.trim().toLowerCase()}|${q.kelas.trim().toLowerCase()}`
    if (scanCounts[scanKey] > 1 || q.status_validasi === 'DITOLAK_VPN') notes.push('Scan ulang: hanya setelah DITOLAK_VPN')
    if (q.status_validasi === 'SAH' || q.status_validasi === 'SAH_DICURIGAI') notes.push('HP dikumpulkan panitia')
    if (q.alasan_validasi && q.alasan_validasi !== 'Valid') notes.push(q.alasan_validasi)
    if (q.ip_status !== 'NORMAL') notes.push(`IP: ${q.ip_status}`)
    if (typeof q.jarak_meter === 'number') notes.push(`Jarak: ${Math.round(q.jarak_meter)}m`)
    return notes
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <MessageSquareText className="w-5 h-5 text-indigo-500" />
            <h2 className="page-title">Wawancara OSIS & MPK</h2>
            <span className="badge border border-slate-200 bg-white text-slate-600">{orgLabel}</span>
          </div>
          <p className="page-sub mt-0.5">Kontrol sesi, antrian digital, dan penilaian kandidat.</p>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <div className="font-mono text-xl font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-4 py-1.5 rounded-xl shadow-sm tracking-widest flex items-center gap-2" suppressHydrationWarning>
            <Clock className="w-4 h-4 text-indigo-400" />
            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          {admin && <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" />Buat/Aktifkan</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card p-4"><div className="text-xs font-bold text-slate-500">Status</div><div className="mt-2"><span className={`badge border ${selectedSession ? statusStyle[selectedSession.status] : 'bg-slate-50 border-slate-200 text-slate-500'}`}>{selectedSession?.status || 'NONAKTIF'}</span></div></div>
            <div className="card p-4"><div className="text-xs font-bold text-slate-500">Antrian</div><div className="text-2xl font-black font-mono text-slate-800">{queue.length}</div></div>
            <div className="card p-4"><div className="text-xs font-bold text-slate-500">Sudah Dinilai</div><div className="text-2xl font-black font-mono text-green-600">{done}</div></div>
            <div className="card p-4"><div className="text-xs font-bold text-slate-500">Belum Dinilai</div><div className="text-2xl font-black font-mono text-amber-600">{Math.max(queue.length - done, 0)}</div></div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  Antrian Kandidat
                  {selectedSession?.status === 'ACTIVE' && selectedSession.jadwal_selesai && (
                    <span className="badge bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      Sisa: {
                        (() => {
                          const ms = new Date(selectedSession.jadwal_selesai).getTime() - currentTime.getTime()
                          if (ms <= 0) return 'Habis'
                          const ts = Math.floor(ms / 1000)
                          const h = Math.floor(ts / 3600), m = Math.floor((ts % 3600) / 60), s = ts % 60
                          return h > 0 ? `${h}j ${m}m ${s}d` : `${m}m ${s}d`
                        })()
                      }
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {selectedSession ? `${formatDateTime(selectedSession.jadwal_mulai)} - ${selectedSession.jadwal_selesai ? formatDateTime(selectedSession.jadwal_selesai) : 'selesai manual'}` : 'Belum ada sesi aktif atau terjadwal'}
                </div>
              </div>
              {selectedSession && (
                <div className="flex gap-2">
                  {admin && selectedSession.status === 'SCHEDULED' && <button onClick={() => updateSession(selectedSession.id, 'activate')} className="btn-secondary btn-sm"><Play className="w-3.5 h-3.5" />Aktifkan</button>}
                  {admin && ['SCHEDULED', 'ACTIVE'].includes(selectedSession.status) && <button onClick={() => openEdit(selectedSession)} className="btn-secondary btn-sm text-indigo-600"><SquarePen className="w-3.5 h-3.5" />Edit Jadwal</button>}
                  {admin && selectedSession.status === 'ACTIVE' && <button onClick={() => setConfirmAction({ id: selectedSession.id, action: 'finish', title: 'Finalisasi hasil?', message: 'Setelah finalisasi, semua data wawancara akan terkunci permanen.' })} className="btn-primary btn-sm"><CheckCircle2 className="w-3.5 h-3.5" />Finalisasi</button>}
                  {admin && ['SCHEDULED', 'ACTIVE'].includes(selectedSession.status) && <button onClick={() => setConfirmAction({ id: selectedSession.id, action: 'cancel', title: 'Batalkan sesi?', message: 'Sesi dibatalkan dan tidak bisa diedit lagi. Buat jadwal baru jika diperlukan.' })} className="btn-secondary btn-sm text-red-600"><XCircle className="w-3.5 h-3.5" />Batal</button>}
                  <button onClick={() => downloadExport(selectedSession.id)} className="btn-secondary btn-sm"><Download className="w-3.5 h-3.5" />Excel</button>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <select value={org} onChange={(e) => setOrg(e.target.value as 'all' | Org)} className="input py-2">
                <option value="all">Semua Ekskul</option>
                <option value="osis">OSIS</option>
                <option value="mpk">MPK</option>
              </select>
              <select value={hasilFilter} onChange={(e) => setHasilFilter(e.target.value)} className="input py-2">
                <option value="">Semua Hasil</option>
                <option value="LOLOS">Lolos</option>
                <option value="TIDAK_LOLOS">Tidak Lolos</option>
              </select>
              <select value={validasiFilter} onChange={(e) => setValidasiFilter(e.target.value)} className="input py-2">
                <option value="">Semua Validasi</option>
                <option value="SAH">Sah</option>
                <option value="SAH_DICURIGAI">Sah + Flag</option>
                <option value="DITOLAK_VPN">Ditolak VPN</option>
                <option value="TIDAK_SAH">Tidak Sah</option>
              </select>
              <input value={kelasDraft} onChange={(e) => setKelasDraft(e.target.value)} className="input py-2" placeholder="Filter kelas, contoh X MPLB 1" />
            </div>

            {loading ? (
              <div className="empty-state"><Loader2 className="w-8 h-8 animate-spin" /><span>Memuat sesi...</span></div>
            ) : !selectedSession ? (
              <div className="empty-state"><CalendarClock className="w-10 h-10 opacity-30" /><span>Wawancara {orgLabel} nonaktif.</span></div>
            ) : queue.length === 0 ? (
              <div className="empty-state"><Users className="w-10 h-10 opacity-30" /><span>Belum ada peserta masuk antrian.</span></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="th">No</th><th className="th">Kandidat</th><th className="th">Ekskul</th><th className="th">Status</th><th className="th">Validasi</th><th className="th">Hasil</th><th className="th">Persentase</th><th className="th">Catatan</th><th className="th"></th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {queue.map((q) => {
                      const notes = noteFor(q)
                      return (
                      <tr key={q.id} className="hover:bg-slate-50">
                        <td className="td font-mono text-slate-400">#{q.nomor_antrian}</td>
                        <td className="td"><div className="font-bold text-slate-800">{q.nama}</div><div className="text-xs text-slate-500">{q.kelas}</div></td>
                        <td className="td"><span className="badge bg-white border border-slate-200 text-slate-600">{orgLabelMap[(q as any).sesiOrg as Org] || 'OSIS & MPK'}</span></td>
                        <td className="td"><span className="badge bg-slate-50 border border-slate-200 text-slate-600">{queueLabel[q.status]}</span></td>
                        <td className="td">
                          <div className="space-y-1">
                            <span className={`badge border ${validationStyle[q.status_validasi]}`}>{validationLabel[q.status_validasi]}</span>
                            <div className="text-[11px] text-slate-400">{q.ip_country || 'IP tidak diketahui'}</div>
                          </div>
                        </td>
                        <td className="td">{q.hasil_wawancara ? <span className={q.hasil_wawancara.hasil === 'LOLOS' ? 'badge bg-green-50 text-green-700 border border-green-200' : 'badge bg-red-50 text-red-700 border border-red-200'}>{resultLabel[q.hasil_wawancara.hasil]}</span> : <span className="text-xs text-slate-400">Belum dinilai</span>}</td>
                        <td className="td font-mono text-sm">{q.hasil_wawancara ? `${q.hasil_wawancara.persentase}%` : '-'}</td>
                        <td className="td">
                          {notes.length ? (
                            <div className="max-w-xs space-y-1 text-xs text-slate-600">
                              {notes.map((note) => <div key={note}>{note}</div>)}
                            </div>
                          ) : <span className="text-xs text-slate-400">-</span>}
                        </td>
                        <td className="td">
                          {(q as any).sesiStatus === 'ACTIVE' ? (
                            <div className="flex gap-1 justify-end">
                              {['SAH', 'SAH_DICURIGAI'].includes(q.status_validasi) && q.status === 'MENUNGGU' && <button onClick={() => setQueueStatus(q.id, 'WAWANCARA')} className="btn-secondary btn-sm"><Clock className="w-3.5 h-3.5" />Panggil</button>}
                              {['SAH', 'SAH_DICURIGAI'].includes(q.status_validasi) && <button onClick={() => openResult(q)} className="btn-primary btn-sm"><SquarePen className="w-3.5 h-3.5" />Nilai</button>}
                              {admin && q.hasil_wawancara && q.hasil_wawancara.hasil === 'TIDAK_LOLOS' && <button onClick={() => openOverride(q)} className="btn-secondary btn-sm text-amber-700"><ShieldCheck className="w-3.5 h-3.5" />Override</button>}
                            </div>
                          ) : <span className="text-xs text-slate-400">Terkunci</span>}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <QrCode className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-800">QR Antrian</h3>
            </div>
            {activeSession ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 leading-relaxed">QR absensi dibuat dari menu Tools agar token unik, masa berlaku, GPS, dan IP tercatat otomatis.</p>
                {admin && <button onClick={() => window.open('/qr-code', '_blank')} className="btn-secondary"><QrCode className="w-4 h-4" />Buka Tools QR Code</button>}
              </div>
            ) : (
              <div className="text-sm text-slate-500 leading-relaxed">QR muncul saat sesi {orgLabel} berstatus ACTIVE.</div>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquareText className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-800">Live Chat Internal</h3>
            </div>
            {activeSession ? (
              <div className="space-y-3">
                <div className="h-72 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  {chats.length === 0 ? <div className="text-xs text-slate-400 text-center py-10">Belum ada pesan.</div> : chats.map((c) => (
                    <div key={c.id} className={`rounded-lg p-2 text-xs ${c.sender.id === user.id ? 'bg-indigo-600 text-white ml-8' : 'bg-white border border-slate-200 text-slate-700 mr-8'}`}>
                      <div className="font-bold mb-1">{c.sender.nama}</div>
                      <div className="leading-relaxed whitespace-pre-wrap">{c.pesan}</div>
                      <div className={c.sender.id === user.id ? 'text-indigo-100 mt-1' : 'text-slate-400 mt-1'}>{formatDateTime(c.created_at, 'HH:mm')}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={chatText} onChange={(e) => setChatText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendChat() }} className="input" placeholder="Tulis pesan konsultasi..." />
                  <button onClick={sendChat} className="btn-primary px-3"><Send className="w-4 h-4" /></button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500 leading-relaxed">Chat hanya aktif selama ada sesi wawancara ACTIVE.</div>
            )}
          </div>

          <div className="card p-5">
            <div className="text-sm font-bold text-slate-800 mb-3">Aturan Edit</div>
            <div className="space-y-2 text-xs text-slate-600">
              <div><strong>SCHEDULED:</strong> semua field masih dapat diubah.</div>
              <div><strong>ACTIVE:</strong> admin menjalankan antrian dan input hasil.</div>
              <div><strong>SELESAI/DIBATALKAN:</strong> data terkunci permanen.</div>
            </div>
          </div>
        </div>
      </div>

      <Modal open={sessionModal} title={editingSessionId ? "Edit Jadwal Wawancara" : "Buat Jadwal Wawancara"} onClose={() => setSessionModal(false)} size="md"
        footer={<div className="flex justify-end gap-2"><button onClick={() => setSessionModal(false)} className="btn-secondary">Batal</button><button onClick={saveSession} disabled={saving} className="btn-primary">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Simpan</button></div>}>
        <div className="space-y-4">
          <div className="form-group"><label className="label">Ekskul</label><select value={fOrg} onChange={(e) => setFOrg(e.target.value as Org)} disabled={!!editingSessionId} className="input"><option value="osis">OSIS</option><option value="mpk">MPK</option></select></div>
          <div className="form-group"><label className="label">Jam Mulai</label><input type="datetime-local" value={fMulai} onChange={(e) => setFMulai(e.target.value)} className="input" /></div>
          <div className="form-group"><label className="label">Jam Selesai</label><input type="datetime-local" value={fSelesai} onChange={(e) => setFSelesai(e.target.value)} className="input" /></div>
        </div>
      </Modal>

      <Modal open={resultModal} title={targetQueue ? `Penilaian ${targetQueue.nama}` : 'Penilaian'} onClose={() => setResultModal(false)} size="lg"
        footer={<div className="flex justify-end gap-2"><button onClick={() => setResultModal(false)} className="btn-secondary">Batal</button><button onClick={saveResult} disabled={saving} className="btn-primary">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Simpan Hasil</button></div>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group"><label className="label">Nama</label><input value={targetQueue?.nama || ''} readOnly className="input bg-slate-50" /></div>
          <div className="form-group"><label className="label">Kelas</label><input value={targetQueue?.kelas || ''} readOnly className="input bg-slate-50" /></div>
          <div className="form-group"><label className="label">Keterangan *</label><select value={fKet} onChange={(e) => setFKet(e.target.value as any)} className="input"><option value="AKTIF">Aktif</option><option value="KURANG_AKTIF">Kurang Aktif</option></select></div>
          <div className="form-group"><label className="label">Hasil *</label><select value={fHasil} onChange={(e) => setFHasil(e.target.value as any)} className="input"><option value="LOLOS">Lolos</option><option value="TIDAK_LOLOS">Tidak Lolos</option></select></div>
          <div className="form-group md:col-span-2"><label className="label">Persentase *</label><input type="number" min={1} max={100} value={fPersen} onChange={(e) => setFPersen(Number(e.target.value))} className="input" /></div>
          <div className="form-group md:col-span-2"><label className="label">Catatan Pembina / Admin</label><textarea value={fCatatan} onChange={(e) => setFCatatan(e.target.value)} className="input min-h-24" placeholder="Opsional" /></div>
        </div>
      </Modal>

      <Modal open={overrideModal} title={overrideTarget ? `Override Hasil ${overrideTarget.nama}` : 'Override Hasil'} onClose={() => setOverrideModal(false)} size="md"
        footer={<div className="flex justify-end gap-2"><button onClick={() => setOverrideModal(false)} className="btn-secondary">Batal</button><button onClick={saveOverride} disabled={saving} className="btn-primary">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}Override ke Lolos</button></div>}>
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Hanya Administrator dapat mengubah kandidat Tidak Lolos menjadi Lolos karena pertimbangan pembina. Alasan akan masuk ke Log Aktivitas.
          </div>
          <div className="form-group"><label className="label">Alasan Override *</label><textarea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} className="input min-h-28" placeholder="Contoh: Pertimbangan Pembina" /></div>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirmAction} title={confirmAction?.title || ''} message={confirmAction?.message || ''} loading={saving}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && updateSession(confirmAction.id, confirmAction.action)}
      />
    </div>
  )
}
