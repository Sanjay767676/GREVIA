import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef1fb',
          100: '#d9e0f6',
          200: '#b7c3ec',
          300: '#8b9cdd',
          400: '#5c72c9',
          500: '#2a3a8f',
          600: '#22307a',
          700: '#1b2661',
          800: '#161f4f',
          900: '#121942',
        },
        gold: {
          50: '#fefae8',
          100: '#fdf1c4',
          200: '#fbe38c',
          300: '#f8d35a',
          400: '#f6c445',
          500: '#eab308',
          600: '#c88a04',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
