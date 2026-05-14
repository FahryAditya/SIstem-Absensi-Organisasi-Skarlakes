import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import QueryProvider from '@/components/providers/QueryProvider'

export const metadata: Metadata = {
  title: 'Sistem Ekstrakurikuler Sekolah — Manajemen Absensi & Kas',
  description: 'Dashboard manajemen absensi, kas, OSIS & MPK',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '14px', borderRadius: '10px' },
              success: { duration: 3000 },
              error: { duration: 4500 },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  )
}
