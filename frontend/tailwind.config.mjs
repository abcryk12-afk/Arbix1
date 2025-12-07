/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0A5FFF",
        accent: "#2DBE6B",
        dark: "#020617",
        muted: "#64748B",
      },
    },
  },
  plugins: [],
};
