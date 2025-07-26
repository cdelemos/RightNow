/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sage green color palette inspired by Duolingo
        sage: {
          50: '#f6f8f6',
          100: '#e3ebe3',
          200: '#c7d8c7',
          300: '#9fbf9f',
          400: '#73a373',
          500: '#578b57', // Main sage green
          600: '#437143',
          700: '#365a36',
          800: '#2d492d',
          900: '#243d24',
        },
        // Complementary colors for gamification
        gold: {
          50: '#fffdf0',
          100: '#fffae0',
          200: '#fff4b8',
          300: '#ffe66d',
          400: '#ffcf1f',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Success/achievement colors
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-soft': 'bounce 1s infinite',
        'pulse-gentle': 'pulse 2s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      boxShadow: {
        'sage': '0 4px 14px 0 rgba(87, 139, 87, 0.15)',
        'sage-lg': '0 10px 15px -3px rgba(87, 139, 87, 0.1), 0 4px 6px -2px rgba(87, 139, 87, 0.05)',
        'inner-sage': 'inset 0 2px 4px 0 rgba(87, 139, 87, 0.06)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    },
  },
  plugins: [],
}