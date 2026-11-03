/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fffdf2',
          100: '#fff9db',
          200: '#fff3b0',
          300: '#ffec85',
          400: '#ffe066',
          500: '#ffd43b',
          600: '#ffc107',
          700: '#ffa000',
          800: '#e68a00',
          900: '#b36b00',
        },
      },
      fontFamily: {
        display: ['Lexend', 'system-ui', 'sans-serif'],
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(255,193,7,0.15), 0 4px 12px -4px rgba(255,193,7,0.25)',
        'card-hover':
          '0 2px 6px rgba(255,193,7,0.25), 0 12px 24px -8px rgba(255,193,7,0.35)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};
