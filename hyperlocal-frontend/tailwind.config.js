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
          900: '#0F172A',
          500: '#16A34A',
          300: '#86EFAC',
          100: '#DCFCE7',
          50: '#F0FDF4',
        }
      }
    },
  },
  plugins: [],
}
