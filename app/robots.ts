import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://s-istem-absensi-organisasi-skarlake.vercel.app'

  return {
    rules: {
      userAgent: '*', // Mengizinkan semua bot pencari (Googlebot, Bingbot, dll)
      allow: '/',     // Mengizinkan penelusuran seluruh halaman publik
      disallow: [
        '/api/',      // Melarang robot mengindeks rute API (keamanan data)
        '/_next/',    // Mencegah robot mengindeks folder internal sistem
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`, // Mengarahkan bot ke peta situs Anda
  }
}
