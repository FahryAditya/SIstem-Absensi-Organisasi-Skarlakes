import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://artemis.smkairlangga.sch.id'
  const routes = ['', '/login', '/dashboard', '/laporan', '/kas', '/pengeluaran', '/wawancara']

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1.0 : 0.8,
  }))
}
