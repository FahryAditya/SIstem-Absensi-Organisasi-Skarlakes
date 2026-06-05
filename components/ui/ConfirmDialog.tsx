'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  confirmClass?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Hapus', cancelLabel = 'Batal', confirmClass = 'btn-danger',
  loading, onConfirm, onCancel
}: ConfirmDialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-deep-navy rounded-2xl shadow-2xl w-full max-w-sm p-6 slide-up">
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-5 justify-end">
          <button onClick={onCancel} disabled={loading} className="btn-secondary btn-sm">{cancelLabel}</button>
          <button onClick={onConfirm} disabled={loading} className={`${confirmClass} btn-sm`}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
