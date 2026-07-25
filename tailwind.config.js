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
        'unit-osis': '#3D3DB8',
        'unit-mpk': '#DC143C',
        'unit-english': '#0F52BA',
        'unit-programming': '#FFB81C',
        blue: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#1E90FF',
          600: '#1C86EE',
          700: '#1874CD',
          800: '#104E8B',
          900: '#0B3D70',
          950: '#072046',
        },
        slate: {
          50: 'rgb(var(--color-bg-50) / <alpha-value>)',
        }
      }
    },
  },
  plugins: [],
}
