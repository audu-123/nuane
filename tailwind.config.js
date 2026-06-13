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
          DEFAULT: '#0052D9',
          light: '#EEF3FF',
          dark: '#003BA5',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
      }
    },
  },
  plugins: [],
}
