/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        grafana: {
          dark: '#1f1f23',
          darker: '#141419',
          border: '#2d2d33',
          text: '#d8d9da',
          textSecondary: '#9e9fa2',
          primary: '#5794f2',
          success: '#73bf69',
          warning: '#f79420',
          critical: '#e24d42',
        },
      },
    },
  },
  plugins: [],
}

