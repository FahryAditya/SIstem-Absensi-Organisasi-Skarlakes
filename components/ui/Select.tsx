'use client'

import { useRef, useState, useEffect, useId } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  /** Ukuran: 'sm' | 'md' (default) */
  size?: 'sm' | 'md'
  id?: string
  required?: boolean
}

/**
 * Select modern — menggantikan native <select>.
 * Fitur: animasi slide-down, ChevronDown flip, highlight selected,
 * close on outside-click / Escape, keyboard-accessible.
 */
export default function Select({
  value,
  onChange,
  options,
  placeholder = '-- Pilih --',
  disabled = false,
  className = '',
  size = 'md',
  id,
  required,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const uid = useId()
  const triggerId = id ?? uid

  const selected = options.find(o => o.value === value) ?? null

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    // Gunakan 'click' (bukan 'mousedown') agar onClick item list sempat berjalan lebih dulu
    document.addEventListener('click', onOutsideClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onOutsideClick)
    }
  }, [open])

  const py = size === 'sm' ? 'py-1.5 text-xs' : 'py-2.5 text-sm'

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        id={triggerId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen(o => !o)}
        className={[
          'w-full flex items-center gap-2 px-3.5 rounded-lg border bg-white text-left',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          open
            ? 'border-[#5482B4] ring-2 ring-[#5482B4]/20 shadow-sm'
            : 'border-[rgba(84,130,180,0.25)] hover:border-[#5482B4]/60',
          py,
        ].join(' ')}
      >
        <span className={`flex-1 truncate ${selected ? 'text-[#011025] font-medium' : 'text-[#7EA0C5]'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 text-[#7EA0C5] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="listbox"
          className={[
            'absolute z-[200] w-full mt-1.5 bg-white rounded-xl',
            'border border-[rgba(84,130,180,0.15)]',
            'shadow-[0_8px_32px_rgba(1,16,37,0.12)]',
            'overflow-hidden',
            'select-dropdown-enter',
          ].join(' ')}
        >
          <ul className="max-h-56 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {/* Placeholder row */}
            {placeholder && (
              <li
                role="option"
                aria-selected={value === ''}
                onMouseDown={e => e.preventDefault()}
                onClick={() => { onChange(''); setOpen(false) }}
                className={[
                  'flex items-center gap-2.5 px-3.5 py-2 cursor-pointer transition-colors',
                  value === '' ? 'bg-[#F4F8FC] text-[#5482B4]' : 'text-[#7EA0C5] hover:bg-[#F4F8FC]',
                ].join(' ')}
              >
                <span className="flex-1 text-sm truncate">{placeholder}</span>
                {value === '' && <Check className="w-3.5 h-3.5 text-[#5482B4] flex-shrink-0" />}
              </li>
            )}

            {options.map(opt => {
              const isSelected = opt.value === value
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => {
                    if (!opt.disabled) {
                      onChange(opt.value)
                      setOpen(false)
                    }
                  }}
                  className={[
                    'flex items-center gap-2.5 px-3.5 py-2 transition-colors',
                    opt.disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : 'cursor-pointer',
                    isSelected
                      ? 'bg-[rgba(84,130,180,0.08)] text-[#052659]'
                      : opt.disabled ? '' : 'hover:bg-[#F4F8FC] text-[#011025]',
                  ].join(' ')}
                >
                  <span className={`flex-1 text-sm truncate ${isSelected ? 'font-semibold' : ''}`}>
                    {opt.label}
                  </span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[#5482B4] flex-shrink-0" />
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Hidden native select for form validation / required */}
      {required && (
        <select
          tabIndex={-1}
          aria-hidden="true"
          required={required}
          value={value}
          onChange={() => {}}
          className="absolute inset-0 opacity-0 pointer-events-none w-full"
        >
          <option value="" />
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
    </div>
  )
}
