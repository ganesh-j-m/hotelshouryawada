/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Bhagwa / saffron — the primary brand colour (from the logo lettering)
        saffron: {
          50: '#FFF6EC',
          100: '#FFE8CF',
          200: '#FFD09F',
          300: '#FFB366',
          400: '#FF931F',
          500: '#F57C0A',
          600: '#E0640A',
          700: '#B84D0B',
          800: '#8F3C0D',
          900: '#5E280B',
        },
        // Deep warm brown — the wood tone of the logo, used for text & dark sections
        ink: {
          50: '#FBF6F2',
          100: '#F3E5DB',
          200: '#E2C4AF',
          300: '#C6967A',
          400: '#9A6447',
          500: '#74412A',
          600: '#5C2D19',
          700: '#4A2313',
          800: '#35180C',
          900: '#210E06',
        },
        cream: { DEFAULT: '#FFF9F2', 100: '#FFFCF8', 200: '#FDF1E3', 300: '#F8E4CC' },
        charcoal: { DEFAULT: '#242424', 600: '#3D3530', 400: '#6E6259', 300: '#8F837A' },
      },
      fontFamily: {
        display: ['Poppins', 'system-ui', 'sans-serif'],
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        marathi: ['Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(53,24,12,0.04), 0 10px 30px -14px rgba(53,24,12,0.20)',
        lift: '0 2px 6px rgba(53,24,12,0.06), 0 28px 50px -22px rgba(184,77,11,0.45)',
        glow: '0 10px 30px -8px rgba(245,124,10,0.55)',
      },
      maxWidth: { content: '76rem' },
      transitionTimingFunction: { smooth: 'cubic-bezier(.22,.61,.36,1)', out: 'cubic-bezier(.16,1,.3,1)' },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(24px)' }, '100%': { opacity: 1, transform: 'none' } },
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        page: { '0%': { opacity: 0, transform: 'translateY(14px)' }, '100%': { opacity: 1, transform: 'none' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        flicker: {
          '0%,100%': { transform: 'scale(1) rotate(0deg)', opacity: 0.9 },
          '30%': { transform: 'scale(1.06,0.96) rotate(-2deg)', opacity: 1 },
          '60%': { transform: 'scale(0.96,1.05) rotate(2deg)', opacity: 0.8 },
        },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        shine: { '0%': { transform: 'translateX(-120%) skewX(-20deg)' }, '100%': { transform: 'translateX(220%) skewX(-20deg)' } },
      },
      animation: {
        'fade-up': 'fade-up .9s cubic-bezier(.16,1,.3,1) both',
        'fade-in': 'fade-in .5s ease both',
        page: 'page .7s cubic-bezier(.16,1,.3,1) both',
        marquee: 'marquee 38s linear infinite',
        float: 'float 7s ease-in-out infinite',
        flicker: 'flicker 2.6s ease-in-out infinite',
        'spin-slow': 'spin-slow 40s linear infinite',
      },
    },
  },
  plugins: [],
};
