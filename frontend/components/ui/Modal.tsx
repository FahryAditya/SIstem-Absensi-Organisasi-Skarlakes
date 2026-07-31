'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: React.ReactNode
}

const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' }

export default function Modal({ open, title, onClose, children, size = 'md', footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  if (!open) return null

  // Handle overlay click safely to avoid accidental closing during drag/scroll
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      <div 
        ref={overlayRef}
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-300" 
        onClick={handleOverlayClick} 
      />
      
      <div className={cn(
        'relative bg-royal-950 rounded-[24px] shadow-2xl w-full flex flex-col max-h-[90vh] sm:max-h-[85vh] slide-up border border-royal-800/30',
        sizes[size]
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-royal-200 flex-shrink-0">
          <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full text-royal-400 hover:text-royal-300 hover:bg-royal-800/50 transition-all active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 px-6 py-5 border-t border-royal-200 bg-cream-50/5 rounded-b-[24px]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
