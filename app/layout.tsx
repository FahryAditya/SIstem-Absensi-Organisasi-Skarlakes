import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import QueryProvider from '@/components/providers/QueryProvider'
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: {
    default: 'Artemis Series • Sistem Ekstrakurikuler & Absensi OSIS MPK',
    template: '%s | Artemis Series'
  },
  description: 'Sistem Informasi Manajemen Ekstrakurikuler, Keuangan Buku Kas Terpadu, Absensi Real-time QR Code, dan Sistem Antrean Wawancara OSIS & MPK Digital Resmi Yayasan Airlangga Balikpapan.',
  keywords: [
    'Sistem Ekstrakurikuler',
    'Absensi OSIS',
    'Aplikasi MPK',
    'Wawancara Sekolah Digital',
    'Absensi QR Code',
    'Manajemen Kas Organisasi',
    'SKARLAKES',
    'SMK Kesehatan Airlangga',
    'Artemis Series',
    'Skarla',
    'SiKadik'
  ],
  authors: [{ name: 'Yayasan Airlangga Balikpapan', url: 'https://smkairlangga.sch.id' }],
  creator: 'Artemis Developer Team',
  publisher: 'SKARLAKES',
  metadataBase: new URL('https://artemis.smkairlangga.sch.id'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Artemis Series • Sistem Ekstrakurikuler & Absensi OSIS MPK',
    description: 'Portal resmi manajemen kegiatan kesiswaan terintegrasi SKARLAKES. Fitur absensi instan QR Code, Buku Kas otomatis, dan wawancara kesiswaan digital.',
    url: 'https://artemis.smkairlangga.sch.id',
    siteName: 'Artemis Series',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: 'https://uploads.onecompiler.io/43k3cj6jv/44ph8dpc9/Logo-smk-airlangga-balikpapan2-1.png',
        width: 800,
        height: 800,
        alt: 'Artemis Series SKARLAKES Logo'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Artemis Series • Sistem Kesiswaan & Absensi Sekolah',
    description: 'Absensi QR Code handal, Laporan Keuangan, dan Antrean Wawancara OSIS & MPK Digital dalam 1 Platform terintegrasi.',
    images: ['https://uploads.onecompiler.io/43k3cj6jv/44ph8dpc9/Logo-smk-airlangga-balikpapan2-1.png']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200"><rect width="1200" height="1200" rx="280" fill="%23052659"/><svg x="160" y="160" width="880" height="880" viewBox="0 -960 960 960" fill="%23ffffff"><path d="M480-120 200-272v-240L40-600l440-240 440 240v320h-80v-276l-80 44v240L480-120Zm0-332 274-148-274-148-274 148 274 148Zm0 241 200-108v-151L480-360 280-470v151l200 108Zm0-241Zm0 90Zm0 0Z"/></svg></svg>'
  },
  verification: {
    google: ['google65a931532649ffe2', '9r12_Fm3WN29l9Avf2y_Vp5Uk-n-ae6uDxJ46NEdW0o']
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Artemis Series - Sistem Informasi Ekstrakurikuler & Kesiswaan",
    "operatingSystem": "All",
    "applicationCategory": "EducationalApplication",
    "description": "Sistem Informasi Manajemen Ekstrakurikuler, Keuangan Buku Kas Terpadu, Absensi Real-time QR Code, dan Sistem Antrean Wawancara OSIS & MPK Digital Resmi Yayasan Airlangga Balikpapan.",
    "publisher": {
      "@type": "EducationalOrganization",
      "name": "SKARLAKES",
      "url": "https://smkairlangga.sch.id"
    }
  }

  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${jetBrainsMono.variable}`}>
      <head>
        {/* Google Structured Data JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
