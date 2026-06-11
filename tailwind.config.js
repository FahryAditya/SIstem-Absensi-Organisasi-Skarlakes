/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Consolas', 'monospace'],
      },
      colors: {
        'deep-navy': '#001F3F',
        'persian-blue': '#1E90FF',
        'unit-osis': '#3D3DB8',
        'unit-mpk': '#DC143C',
        'unit-english': '#0F52BA',
        'unit-programming': '#FFB81C',
        indigo: {
          50: '#E6F4FF',
          100: '#BAE0FF',
          200: '#91D5FF',
          300: '#69C0FF',
          400: '#40A9FF',
          500: '#1E90FF', // Persian Blue
          600: '#1C86EE',
          700: '#1874CD',
          800: '#104E8B',
          900: '#001F3F', // Deep Navy
          950: '#001021',
        },
        slate: {
          50: 'rgb(var(--color-bg-50) / <alpha-value>)',
        }
      }
    },
  },
  plugins: [],
}
