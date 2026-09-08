import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta extraída diretamente da logo do Zup (roxo + verde-lima)
        primary: {
          DEFAULT: '#650199',
          hover: '#7705B3',
          dark: '#4A0170',
          50: '#F7F3F9',
          100: '#EDE1F4',
          200: '#DEBEEF',
          300: '#C982ED',
          400: '#B234F4',
          500: '#650199',
          600: '#54017F',
          700: '#400160',
          800: '#2F0047',
          900: '#1E002E',
        },
        accent: {
          DEFAULT: '#CBDA59',
          hover: '#C1D338',
          dark: '#AFC12B',
          light: '#E3EBA4',
        },
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        background: '#FAF9FC',
        foreground: '#1A1024',
        muted: {
          DEFAULT: '#F2EEF6',
          foreground: '#6B6478',
        },
        border: '#E4DEEE',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(101, 1, 153, 0.08), 0 1px 2px -1px rgba(101, 1, 153, 0.06)',
        elevated: '0 10px 30px -10px rgba(101, 1, 153, 0.28)',
        glow: '0 0 0 4px rgba(203, 218, 89, 0.3)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(203, 218, 89, 0.6)' },
          '100%': { boxShadow: '0 0 0 14px rgba(203, 218, 89, 0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'pulse-ring': 'pulse-ring 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
