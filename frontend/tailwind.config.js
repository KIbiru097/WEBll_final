/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        /* Three-color palette, on purpose: cream (surface), grey (text/structure,
           aliased as "ink" so existing markup keeps working), and a single clay/brown
           accent for CTAs, links and active states. Standard scale: 50 = lightest, 900 = darkest. */
        cream: {
          DEFAULT: '#F7F3EC',
          50: '#FEFDFB',
          100: '#F7F3EC',
          200: '#F0E9DB',
        },
        ink: {
          50: '#FAFAF8',
          100: '#F0EEE9',
          200: '#E3DFD6',
          300: '#CCC5B8',
          400: '#A6A0A6',
          500: '#8A8378',
          600: '#6B655C',
          700: '#4F4A43',
          800: '#332F2B',
          900: '#1E1B18',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          hover: '#F7F3EC',
        },
        /* "accent" = warm clay/brown — the single highlight color for CTAs, links,
           active states, and anything that needs to draw the eye. */
        accent: {
          50: '#F6EEE6',
          100: '#EBDCC9',
          200: '#D9BE9C',
          300: '#C39D6E',
          400: '#AD7F4E',
          500: '#8F6339',
          600: '#77502D',
          700: '#5E3F24',
          800: '#472F1B',
          900: '#301F12',
        },
        /* kept as an alias of accent so any legacy `brand-*` classes still resolve
           to the same single accent color instead of introducing a second hue. */
        brand: {
          50: '#F6EEE6',
          100: '#EBDCC9',
          200: '#D9BE9C',
          300: '#C39D6E',
          400: '#AD7F4E',
          500: '#8F6339',
          600: '#77502D',
          700: '#5E3F24',
          800: '#472F1B',
          900: '#301F12',
        },
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(30, 27, 24, 0.06), 0 8px 24px rgba(30, 27, 24, 0.06)',
        card: '0 2px 4px rgba(30, 27, 24, 0.05), 0 16px 40px rgba(30, 27, 24, 0.08)',
        lift: '0 12px 28px rgba(30, 27, 24, 0.12)',
        glow: '0 0 0 4px rgba(143, 99, 57, 0.16)',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(20px, -30px) scale(1.05)' },
          '66%': { transform: 'translate(-15px, 15px) scale(0.97)' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fadeIn 0.4s ease both',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-down': 'slideDown 0.25s ease both',
        blob: 'blob 12s infinite ease-in-out',
      },
    },
  },
  plugins: [],
}
