import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#171717',
          charcoal: '#292929',
        },
        paper: {
          DEFAULT: '#F4F0E7',
          white: '#FFFFFF',
          deep: '#EAE4D8',
        },
        seal: {
          DEFAULT: '#B52B27',
          soft: '#C9564F',
          deep: '#8E211E',
        },
        sage: {
          DEFAULT: '#8D9987',
          soft: '#AAB3A5',
          deep: '#6E7A68',
        },
        muted: '#6B6B6B',
        faint: '#8C8C8C',
        darkgray: '#A7A7A7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Noto Serif SC"', 'Georgia', 'serif'],
        brush: ['"Ma Shan Zheng"', '"Noto Serif SC"', 'serif'],
      },
      boxShadow: {
        seal: '0 2px 14px -4px rgba(181, 43, 39, 0.6)',
        soft: '0 8px 30px -12px rgba(23, 23, 23, 0.35)',
      },
      backgroundImage: {
        'paper-grain':
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        'ink-in': {
          '0%': { opacity: '0', filter: 'blur(6px)', transform: 'translateY(8px)' },
          '100%': { opacity: '1', filter: 'blur(0)', transform: 'translateY(0)' },
        },
        'pulse-rec': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        brush: {
          '0%': { transform: 'scaleX(0)', opacity: '0' },
          '100%': { transform: 'scaleX(1)', opacity: '1' },
        },
      },
      animation: {
        'ink-in': 'ink-in 0.6s ease-out both',
        'pulse-rec': 'pulse-rec 1.4s ease-in-out infinite',
        'fade-up': 'fade-up 0.45s ease-out both',
        brush: 'brush 0.5s ease-out both',
      },
    },
  },
  plugins: [],
} satisfies Config
