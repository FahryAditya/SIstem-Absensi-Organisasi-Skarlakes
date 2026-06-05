'use client'

import { useRef, useState, useEffect, useId, useCallback } from 'react'
import { createPortal } from 'react-dom'
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

interface DropdownPos {
  top: number
  left: number
  width: number
  openUpward: boolean
}

/**
 * Select modern — menggantikan native <select>.
 * Dropdown di-render via createPortal ke document.body agar tidak
 * tertutup oleh stacking context parent (card, overflow, z-index).
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
  const [pos, setPos] = useState<DropdownPos | null>(null)
  const [mounted, setMounted] = useState(false)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const uid = useId()
  const triggerId = id ?? uid

  const selected = options.find(o => o.value === value) ?? null

  // Pastikan kita ada di client sebelum pakai portal
  useEffect(() => { setMounted(true) }, [])

  // Hitung posisi dropdown relatif ke viewport
  const calcPos = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const dropdownH = Math.min(options.length * 40 + 16, 240)
    const openUpward = spaceBelow < dropdownH && spaceAbove > dropdownH

    setPos({
      top: openUpward
        ? rect.top + window.scrollY - dropdownH - 6
        : rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
      width: rect.width,
      openUpward,
    })
  }, [options.length])

  // Buka dropdown
  function handleOpen() {
    if (disabled) return
    if (!open) {
      calcPos()
      setOpen(true)
    } else {
      setOpen(false)
    }
  }

  // Tutup saat klik di luar atau tekan Escape
  useEffect(() => {
    if (!open) return

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    function onOutsideClick(e: MouseEvent) {
      const target = e.target as Node
      const insideTrigger = triggerRef.current?.contains(target)
      const insideDropdown = dropdownRef.current?.contains(target)
      if (!insideTrigger && !insideDropdown) {
        setOpen(false)
      }
    }

    // Recalculate posisi saat scroll/resize
    function onScroll() { calcPos() }
    function onResize() { calcPos() }

    document.addEventListener('keydown', onKey)
    document.addEventListener('click', onOutsideClick)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)

    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onOutsideClick)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open, calcPos])

  const py = size === 'sm' ? 'py-1.5 text-xs' : 'py-2.5 text-sm'

  const dropdown = mounted && open && pos ? createPortal(
    <div
      ref={dropdownRef}
      role="listbox"
      style={{
        position: 'absolute',
        top: pos.top,
        left: pos.left,
        width: pos.width,
        zIndex: 99999,
      }}
      className={[
        'bg-deep-navy rounded-xl',
        'border border-[rgba(84,130,180,0.15)]',
        'shadow-[0_8px_32px_rgba(1,16,37,0.14)]',
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
              value === '' ? 'bg-[#F4F8FC] text-[#1E90FF]' : 'text-[#7EA0C5] hover:bg-[#F4F8FC]',
            ].join(' ')}
          >
            <span className="flex-1 text-sm truncate">{placeholder}</span>
            {value === '' && <Check className="w-3.5 h-3.5 text-[#1E90FF] flex-shrink-0" />}
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
                  ? 'bg-[rgba(84,130,180,0.08)] text-[#001F3F]'
                  : opt.disabled ? '' : 'hover:bg-[#F4F8FC] text-[#001F3F]',
              ].join(' ')}
            >
              <span className={`flex-1 text-sm truncate ${isSelected ? 'font-semibold' : ''}`}>
                {opt.label}
              </span>
              {isSelected && (
                <Check className="w-3.5 h-3.5 text-[#1E90FF] flex-shrink-0" />
              )}
            </li>
          )
        })}
      </ul>
    </div>,
    document.body
  ) : null

  return (
    <div className={`relative ${className}`}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        id={triggerId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={handleOpen}
        className={[
          'w-full flex items-center gap-2 px-3.5 rounded-lg border bg-deep-navy text-left',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          open
            ? 'border-[#1E90FF] ring-2 ring-[#1E90FF]/20 shadow-sm'
            : 'border-[rgba(84,130,180,0.25)] hover:border-[#1E90FF]/60',
          py,
        ].join(' ')}
      >
        <span className={`flex-1 truncate ${selected ? 'text-[#001F3F] font-medium' : 'text-[#7EA0C5]'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 text-[#7EA0C5] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown — render via portal agar tidak terpengaruh stacking context parent */}
      {dropdown}

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
