/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Nonaktifkan source map di production — hemat ~30-50MB RAM saat build & runtime
  productionBrowserSourceMaps: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uploads.onecompiler.io',
      },
    ],
    // Format modern untuk ukuran file lebih kecil
    formats: ['image/avif', 'image/webp'],
    // Batasi cache gambar agar tidak memenuhi disk VPS
    minimumCacheTTL: 3600,
    deviceSizes: [640, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
  },

  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs', 'xlsx'],
    // Kurangi import yang tidak perlu di bundle
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
    ],
  },

  // Kompres response HTTP
  compress: true,

  // Header caching untuk aset statis
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

module.exports = nextConfig

