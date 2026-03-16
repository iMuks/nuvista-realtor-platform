/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#e8edf5',
          100: '#c5d0e6',
          200: '#9fb0d3',
          300: '#7890c0',
          400: '#567ab1',
          500: '#0f2b52',
          600: '#0d2449',
          700: '#0b1d3a',
          800: '#08162c',
          900: '#050e1d',
        },
        gold: {
          50:  '#faf8f3',
          100: '#f3edd9',
          200: '#e8dfc1',
          300: '#d4c59a',
          400: '#c6b37e',
          500: '#beaf87',
          600: '#a89468',
          700: '#8c7a50',
          800: '#6e5f3c',
          900: '#4e4229',
        },
        cream: {
          DEFAULT: '#f8f5f0',
          dark:    '#f0ebe4',
        },
        brand: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
          800: '#14532d',
          900: '#052e16',
        },
        slate: {
          925: '#0d1117',
          950: '#080b11',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:    ['"Inter"', 'system-ui', 'sans-serif'],
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in':        'fadeIn 0.6s ease-out both',
        'slide-up':       'slideUp 0.6s ease-out both',
        'slide-in-right': 'slideInRight 0.4s ease-out both',
        'ken-burns':      'kenBurns 18s ease-in-out infinite alternate',
        'ticker':         'ticker 30s linear infinite',
        'pulse-dot':      'pulseDot 2s ease-in-out infinite',
        'shimmer':        'shimmer 1.5s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(28px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        slideInRight: {
          '0%':   { transform: 'translateX(24px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        kenBurns: {
          '0%':   { transform: 'scale(1)    translateX(0)   translateY(0)' },
          '100%': { transform: 'scale(1.08) translateX(-1%) translateY(-1%)' },
        },
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.5', transform: 'scale(0.85)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
      transitionTimingFunction: {
        'out-expo':   'cubic-bezier(0.19, 1, 0.22, 1)',
        'in-out-circ': 'cubic-bezier(0.785, 0.135, 0.15, 0.86)',
      },
      boxShadow: {
        'card':       '0 2px 16px rgba(15,43,82,0.07), 0 1px 4px rgba(15,43,82,0.04)',
        'card-hover': '0 12px 40px rgba(15,43,82,0.14), 0 4px 12px rgba(15,43,82,0.08)',
        'gold':       '0 8px 30px rgba(190,175,135,0.35)',
        'navy':       '0 8px 30px rgba(15,43,82,0.3)',
      },
    },
  },
  plugins: [],
};
