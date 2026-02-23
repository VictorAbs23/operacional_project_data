import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EBF3FB',
          100: '#C8DFF5',
          200: '#91BFE9',
          500: '#155F97',
          700: '#0D3B60',
          900: '#041628',
        },
        accent: {
          50: '#E8F9EF',
          500: '#16B85F',
          700: '#0D7A3E',
        },
        neutral: {
          0: '#FFFFFF',
          50: '#F8F9FA',
          100: '#F1F3F5',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#ADB5BD',
          500: '#6C757D',
          700: '#343A40',
          900: '#0D1117',
        },
        success: '#16B85F',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#155F97',
      },
      fontFamily: {
        display: ['"Barlow Condensed"', ...fontFamily.sans],
        body: ['Barlow', ...fontFamily.sans],
        mono: ['"JetBrains Mono"', ...fontFamily.mono],
      },
      fontSize: {
        xs: ['12px', '16px'],
        sm: ['14px', '20px'],
        base: ['16px', '24px'],
        lg: ['18px', '28px'],
        xl: ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '36px'],
        '4xl': ['36px', '40px'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.06)',
        md: '0 4px 12px rgba(0,0,0,0.08)',
        lg: '0 8px 24px rgba(0,0,0,0.10)',
        xl: '0 16px 40px rgba(0,0,0,0.12)',
        primary: '0 4px 14px rgba(21,95,151,0.25)',
        accent: '0 4px 14px rgba(22,184,95,0.25)',
      },
    },
  },
  plugins: [],
} satisfies Config;
