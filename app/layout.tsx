import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import QueryProvider from '@/components/providers/QueryProvider'

export const metadata: Metadata = {
  title: 'Sistem Ekstrakurikuler & Absensi OSIS MPK',
  description: 'Aplikasi manajemen ekstrakurikuler sekolah terpadu. Fitur absensi QR Code, antrean wawancara digital, manajemen anggota, dan keuangan organisasi OSIS & MPK.',
  keywords: 'sistem ekstrakurikuler, absensi osis, aplikasi mpk, web wawancara sekolah, absensi qr code, manajemen organisasi siswa, smk airlangga',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200"><rect width="1200" height="1200" rx="280" fill="%23052659"/><svg x="160" y="160" width="880" height="880" viewBox="0 -960 960 960" fill="%23ffffff"><path d="M480-120 200-272v-240L40-600l440-240 440 240v320h-80v-276l-80 44v240L480-120Zm0-332 274-148-274-148-274 148 274 148Zm0 241 200-108v-151L480-360 280-470v151l200 108Zm0-241Zm0 90Zm0 0Z"/></svg></svg>'
  },
  verification: {
    google: 'google65a931532649ffe2'
  }
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
