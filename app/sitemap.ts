import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // Ganti URL ini dengan domain asli Anda saat sudah rilis (misal: https://absensiskarlakes.com)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sistem-absensi-organisasi-skarlakes.com'

  return [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1, // Halaman utama (prioritas tertinggi)
    },
    {
      url: `${baseUrl}/wawancara`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8, // Fitur utama, penting untuk diindeks
    },
    {
      url: `${baseUrl}/absensi`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/kas`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5, // Halaman login tidak butuh prioritas tinggi di pencarian
    },
  ]
}
