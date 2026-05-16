'use client'

import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useRef, useState } from 'react'

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const prevPath = useRef(pathname)
  const isMobileRef = useRef(false)

  useEffect(() => {
    isMobileRef.current = window.innerWidth < 1024 || ('ontouchstart' in window)
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (isMobileRef.current || prefersReduced) {
      setVisible(true)
      return
    }
    if (prevPath.current !== pathname) {
      setVisible(false)
      prevPath.current = pathname
      const t = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(t)
    } else {
      setVisible(true)
    }
  }, [pathname])

  return (
    <div
      className="w-full"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 0.18s ease, transform 0.18s ease',
      }}
    >
      {children}
    </div>
  )
}
