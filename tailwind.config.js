/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff1f1',
          100: '#ffd6d6',
          200: '#ffaaaa',
          300: '#ff7070',
          400: '#ff3d3d',
          500: '#fe0000',
          600: '#e50001',
          700: '#cc0001',
          800: '#a80001',
          900: '#870000',
          950: '#4b0000',
        },
        navy: {
          50:  '#f0f1fa',
          100: '#d9dcf0',
          200: '#b3b9e1',
          300: '#8d96d2',
          400: '#6773c3',
          500: '#4150b4',
          600: '#344090',
          700: '#27306c',
          800: '#1a2048',
          900: '#222335',
          950: '#0d0e1a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
