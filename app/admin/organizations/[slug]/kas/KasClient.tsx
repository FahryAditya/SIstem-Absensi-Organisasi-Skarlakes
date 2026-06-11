'use client'

import { useState, useEffect, useCallback } from 'react'
import Table from '@/components/ui/Table'
import { Wallet, TrendingUp, TrendingDown, History, Search } from 'lucide-react'
import { fetchJsonCachedUrl } from '@/lib/client-cache'
import { formatDateTime } from '@/lib/utils'

interface TransactionData {
  id: number
  amount: number
  description: string
  created_at: string
  member: { name: string } | null
}

interface Props {
  slug: string
}

export default function KasClient({ slug }: Props) {
  const [data, setData] = useState<{ transactions: TransactionData[], totalBalance: number }>({ transactions: [], totalBalance: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const json = await fetchJsonCachedUrl<{ data?: any }>(`/api/organizations/${slug}/cash`)
    setData(json.data || { transactions: [], totalBalance: 0 })
    setLoading(false)
  }, [slug])

  useEffect(() => { load() }, [load])

  const filteredTransactions = data.transactions.filter(t => 
    t.description.toLowerCase().includes(search.toLowerCase()) || 
    (t.member?.name || '').toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { key: 'date', label: 'Tanggal', render: (t: TransactionData) => (
      <span className="text-xs text-slate-400">{formatDateTime(t.created_at)}</span>
    )},
    { key: 'member', label: 'Anggota', render: (t: TransactionData) => (
      <span className="text-sm font-bold text-white">{t.member?.name || 'Sistem'}</span>
    )},
    { key: 'description', label: 'Keterangan', render: (t: TransactionData) => (
      <span className="text-xs text-slate-300">{t.description}</span>
    )},
    { key: 'amount', label: 'Jumlah', render: (t: TransactionData) => (
      <span className={`text-sm font-black font-mono ${t.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
        {t.amount >= 0 ? '+' : ''}Rp {t.amount.toLocaleString('id-ID')}
      </span>
    )}
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 border-l-4 border-persian-blue bg-persian-blue/5">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            <Wallet className="w-3.5 h-3.5" /> Total Saldo Kas
          </div>
          <div className="text-3xl font-black text-white font-mono">Rp {data.totalBalance.toLocaleString('id-ID')}</div>
        </div>
        <div className="card p-5 border-l-4 border-green-500 bg-green-500/5">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            <TrendingUp className="w-3.5 h-3.5" /> Total Pemasukan
          </div>
          <div className="text-2xl font-black text-green-500 font-mono">Rp {data.totalBalance.toLocaleString('id-ID')}</div>
        </div>
        <div className="card p-5 border-l-4 border-red-500 bg-red-500/5">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            <TrendingDown className="w-3.5 h-3.5" /> Total Pengeluaran
          </div>
          <div className="text-2xl font-black text-red-500 font-mono">Rp 0</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari transaksi..." 
            className="input pl-10 h-10" 
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <History className="w-4 h-4" /> Riwayat Transaksi
        </div>
      </div>

      <Table 
        columns={columns} 
        data={filteredTransactions} 
        loading={loading} 
        emptyMessage="Belum ada transaksi kas" 
        rowKey={(t: TransactionData) => t.id} 
      />
    </div>
  )
}
