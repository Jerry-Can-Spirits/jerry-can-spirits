/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'jerry-green': {
          50: '#f0f9f4',
          100: '#dcf2e4',
          200: '#bbe5cc',
          300: '#8dd3aa',
          400: '#5abb81',
          500: '#38a063',
          600: '#2a824f',
          700: '#236842',
          800: '#1e5337',
          900: '#1a442e',
          950: '#0e2519',
        },
        'parchment': {
          50: '#fefdfb',
          100: '#fcf9f3',
          200: '#f7f1e3',
          300: '#f1e7d0',
          400: '#e9d8b7',
          500: '#dfc396',
          600: '#d0a972',
          700: '#bc8c54',
          800: '#9b7048',
          900: '#7f5c3e',
          950: '#432f20',
        },
        'gold': {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
      },
      fontFamily: {
        'serif': ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Playfair Display', 'Georgia', 'serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#f1e7d0',
            '[class~="lead"]': {
              color: '#dfc396',
            },
            a: {
              color: '#fcd34d',
              '&:hover': {
                color: '#f59e0b',
              },
            },
            strong: {
              color: '#fef3c7',
            },
            'ol > li::marker': {
              color: '#d97706',
            },
            'ul > li::marker': {
              color: '#d97706',
            },
            hr: {
              borderColor: '#92400e',
            },
            blockquote: {
              color: '#dfc396',
              borderLeftColor: '#d97706',
            },
            h1: {
              color: '#fef3c7',
            },
            h2: {
              color: '#fef3c7',
            },
            h3: {
              color: '#fef3c7',
            },
            h4: {
              color: '#fef3c7',
            },
            'figure figcaption': {
              color: '#dfc396',
            },
            code: {
              color: '#fcd34d',
            },
            'a code': {
              color: '#fcd34d',
            },
            pre: {
              color: '#f1e7d0',
              backgroundColor: '#1a442e',
            },
            thead: {
              color: '#fef3c7',
              borderBottomColor: '#92400e',
            },
            'tbody tr': {
              borderBottomColor: '#432f20',
            },
          },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(20px)' 
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)' 
          },
        },
        bounceGentle: {
          '0%, 100%': { 
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' 
          },
          '50%': { 
            transform: 'translateY(-5px)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' 
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-200% 0',
          },
          '100%': {
            backgroundPosition: '200% 0',
          },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-pattern': "linear-gradient(135deg, rgba(26, 68, 46, 0.9) 0%, rgba(30, 83, 55, 0.8) 100%)",
        'card-pattern': "linear-gradient(135deg, rgba(241, 231, 208, 0.1) 0%, rgba(223, 195, 150, 0.05) 100%)",
      },
      boxShadow: {
        'glow': '0 0 20px rgba(252, 211, 77, 0.3)',
        'glow-sm': '0 0 10px rgba(252, 211, 77, 0.2)',
        'inner-glow': 'inset 0 0 20px rgba(252, 211, 77, 0.1)',
        'elegant': '0 10px 25px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}