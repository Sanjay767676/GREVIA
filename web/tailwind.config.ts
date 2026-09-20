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
          50: '#fff9e6',
          100: '#ffefc2',
          200: '#ffe499',
          300: '#ffd970',
          400: '#ffcd47',
          500: '#ffbf00',
          600: '#e6ac00',
          700: '#cc9900',
          800: '#b38600',
          900: '#997300',
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
