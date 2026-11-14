/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        orbit: {
          950: '#070d19',
          900: '#0a1222',
          800: '#111e32',
          700: '#1b2d49',
          blue: '#4f8cff',
          cyan: '#55d6e8'
        }
      }
    }
  },
  plugins: []
};
