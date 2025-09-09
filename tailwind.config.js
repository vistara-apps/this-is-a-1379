/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(210, 36%, 96%)',
        accent: 'hsl(180, 70%, 40%)',
        primary: 'hsl(210, 87%, 47%)',
        surface: 'hsl(210, 30%, 99%)',
        'text-primary': 'hsl(220, 25%, 15%)',
        'text-secondary': 'hsl(220, 20%, 50%)',
      },
      borderRadius: {
        'lg': '16px',
        'md': '10px',
        'sm': '6px',
      },
      spacing: {
        'lg': '20px',
        'md': '12px',
        'sm': '8px',
      },
      boxShadow: {
        'card': '0 4px 12px hsla(220, 25%, 15%, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 250ms cubic-bezier(0.215, 0.61, 0.355, 1)',
        'slide-up': 'slideUp 400ms cubic-bezier(0.215, 0.61, 0.355, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}