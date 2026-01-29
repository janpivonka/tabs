/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      animation: {
        'float': 'float 8s ease-in-out infinite',
        'pulse-slow': 'pulse 12s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) scale(1)', opacity: 0.15 },
          '50%': { transform: 'translateY(-30px) scale(1.05)', opacity: 0.25 },
        }
      }
    },
  },
  plugins: [],
};