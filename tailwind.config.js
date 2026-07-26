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
        'unit-osis': '#1E3A8A',
        'unit-mpk': '#B91C1C',
        'unit-english': '#1E3A8A',
        'unit-programming': '#FBBF24',
        'royal': {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#1E3A8A',
          700: '#1E3A8A',
          800: '#1E3A8A',
          900: '#0F2668',
          950: '#071843',
        },
        'cream': {
          50: '#FFFDF5',
          100: '#FFF8F0',
          200: '#FFEFD6',
          300: '#FDE4B3',
          400: '#FCD38A',
          500: '#FAC15A',
        },
        'yellow-bright': {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
      }
    },
  },
  plugins: [],
}
