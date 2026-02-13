/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'clear-blue': '#1a56db',
        'clear-dark': '#0f172a',
        'clear-card': '#1e293b',
        'clear-border': '#334155',
      },
    },
  },
  plugins: [],
}
