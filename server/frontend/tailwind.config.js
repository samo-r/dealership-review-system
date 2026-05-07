/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#0891b2",   // cyan-600 — public/marketing accent
          dark: "#0e7490",      // cyan-700
          light: "#cffafe",     // cyan-100
        },
        dashboard: {
          bg: "#0f172a",        // slate-900 — sidebar background
          surface: "#1e293b",   // slate-800 — cards/panels
          border: "#334155",    // slate-700
          text: "#94a3b8",      // slate-400 — muted text
        },
      },
    },
  },
  plugins: [],
};
