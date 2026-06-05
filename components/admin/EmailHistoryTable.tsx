"use client"

import { useState, useEffect } from 'react'
import { Calendar, User, Mail, ShieldAlert, CheckCircle, XCircle, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { generateCSVFromLogs } from '@/lib/services/email.utils'

interface EmailLog {
  id: number
  subject: string
  recipientEmail: string
  recipientName: string
  emailType: string
  organizationType: string
  status: string
  error_message: string | null
  created_at: string
  admin: {
    nama: string
  }
}

interface EmailHistoryTableProps {
  organizationType: string // 'programming' | 'english' | 'osis' | 'mpk'
}

export default function EmailHistoryTable({ organizationType }: EmailHistoryTableProps) {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 10

  const fetchLogs = async (currentPage: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/email/logs?organisasi=${organizationType}&page=${currentPage}&limit=${limit}`)
      const result = await res.json()
      if (result.success) {
        setLogs(result.data)
        setTotalPages(result.pagination.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching email logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    fetchLogs(1)
  }, [organizationType])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
      fetchLogs(newPage)
    }
  }

  const handleExport = () => {
    if (logs.length === 0) return
    const csvContent = generateCSVFromLogs(logs)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `email_history_${organizationType}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      {/* Table actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Riwayat Notifikasi Email</h3>
        {logs.length > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor CSV
          </button>
        )}
      </div>

      {/* Table content */}
      <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.01]">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-slate-500 border-t-white rounded-full animate-spin mx-auto mb-3" />
            Memuat riwayat email...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Mail className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm font-medium">Belum ada email yang dikirim.</p>
            <p className="text-xs text-slate-300">Histori pengiriman email manual akan tercatat di sini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-slate-400 text-xs font-semibold uppercase">
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Penerima</th>
                  <th className="p-4">Subjek</th>
                  <th className="p-4">Tipe</th>
                  <th className="p-4">Pengirim</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 text-xs font-medium text-slate-400 shrink-0 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-white">{log.recipientName}</p>
                      <p className="text-xs text-slate-400">{log.recipientEmail}</p>
                    </td>
                    <td className="p-4 max-w-xs truncate font-medium text-slate-200" title={log.subject}>
                      {log.subject}
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
                        {log.emailType}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-medium text-slate-400">
                      {log.admin?.nama || 'System'}
                    </td>
                    <td className="p-4 text-center shrink-0">
                      {log.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded-full">
                          <CheckCircle className="w-3.5 h-3.5" /> Terkirim
                        </span>
                      ) : (
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 text-xs text-red-400 font-semibold bg-red-500/10 px-2 py-1 rounded-full" title={log.error_message || ''}>
                            <XCircle className="w-3.5 h-3.5" /> Gagal
                          </span>
                          {log.error_message && (
                            <span className="text-[10px] text-red-500 max-w-[120px] truncate mt-1">
                              {log.error_message}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between p-2">
          <span className="text-xs text-slate-400">
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
