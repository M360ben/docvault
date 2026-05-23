/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dde6ff',
          200: '#b4c8ff',
          400: '#6090f8',
          600: '#2d5fe8',
          800: '#1a3a9e',
          900: '#0e2261',
        }
      }
    }
  },
  plugins: []
}
