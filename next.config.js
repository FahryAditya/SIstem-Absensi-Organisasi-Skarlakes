/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uploads.onecompiler.io',
      },
    ],
    // Aktifkan optimasi gambar modern
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs', 'xlsx'],
    // Optimalkan ukuran bundle
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
    ],
  },
  // Kompres response
  compress: true,
}

module.exports = nextConfig
