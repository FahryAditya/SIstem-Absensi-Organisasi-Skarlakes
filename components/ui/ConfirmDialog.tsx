'use client'

import { AlertTriangle, Loader2, Info } from 'lucide-react'
import { useState } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  confirmClass?: string
  loading?: boolean
  /** Optional: detail data yang akan dihapus (ditampilkan sebagai card) */
  details?: { label: string; value: string }[]
  /** Optional: minta user mengetik nama untuk konfirmasi (biasanya untuk bulk delete) */
  confirmInput?: {
    placeholder?: string
    expectedValue: string
    hint?: string
  }
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Hapus', cancelLabel = 'Batal', confirmClass = 'btn-danger',
  loading, details, confirmInput, onConfirm, onCancel
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState('')

  // Reset input saat dialog dibuka/ditutup
  if (open && inputValue !== '' && !confirmInput) {
    setInputValue('')
  }

  if (!open) return null

  const isInputValid = !confirmInput || inputValue === confirmInput.expectedValue

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#051525] rounded-2xl shadow-2xl w-full max-w-md p-6 slide-up border border-white/10">
        {/* Header Icon & Title */}
        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0 border border-red-500/20">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white">{title}</h3>
            <p className="text-sm text-slate-300 mt-1.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: message }} />
          </div>
        </div>

        {/* Detail Data Card */}
        {details && details.length > 0 && (
          <div className="mt-4 bg-white/5 rounded-xl border border-white/10 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              <Info className="w-3.5 h-3.5" />
              Detail Data
            </div>
            {details.map((d, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-slate-400">{d.label}</span>
                <span className="text-white font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Confirmation Input */}
        {confirmInput && (
          <div className="mt-4 space-y-2">
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-widest">
              Ketik <span className="text-red-400 font-black">{confirmInput.expectedValue}</span> untuk konfirmasi
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={confirmInput.placeholder || `Ketik ${confirmInput.expectedValue}`}
              className="input py-2.5 border-red-500/30 focus:border-red-500 focus:ring-red-500/30"
              autoFocus
            />
            {confirmInput.hint && (
              <p className="text-xs text-slate-400">{confirmInput.hint}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-6 justify-end">
          <button onClick={onCancel} disabled={loading} className="btn-secondary btn-sm">{cancelLabel}</button>
          <button
            onClick={onConfirm}
            disabled={loading || !isInputValid}
            className={`${confirmClass} btn-sm ${!isInputValid ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
