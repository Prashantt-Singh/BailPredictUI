/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        appBg: "#f0f2f5",
        cardBg: "#ffffff",
        textMain: "#1a1d27",
        textMuted: "#8c94a3",
        brandPrimary: "#f04438",
        brandSoft: "#fdeceb",
        borderSoft: "#e5e7eb",
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
