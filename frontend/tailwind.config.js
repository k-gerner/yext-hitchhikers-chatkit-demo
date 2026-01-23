/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        slideIn: {
          'from': {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        fadeIn: {
          'from': {
            opacity: '0',
            transform: 'translateY(5px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        blink: {
          '0%, 60%, 100%': {
            opacity: '0.3'
          },
          '30%': {
            opacity: '1'
          }
        }
      },
      animation: {
        slideIn: 'slideIn 0.3s ease-out',
        fadeIn: 'fadeIn 0.3s ease-out',
        blink: 'blink 1.4s infinite',
        'blink-delay-1': 'blink 1.4s infinite 0.2s',
        'blink-delay-2': 'blink 1.4s infinite 0.4s'
      }
    },
  },
  plugins: [],
}
