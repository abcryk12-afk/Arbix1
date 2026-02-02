/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundColor: {
        page: "rgb(var(--t-page) / <alpha-value>)",
        surface: "rgb(var(--t-surface) / <alpha-value>)",
        card: "rgb(var(--t-surface-2) / <alpha-value>)",
        muted: "rgb(var(--t-overlay) / <alpha-value>)",
      },
      colors: {
        page: "rgb(var(--t-page) / <alpha-value>)",
        surface: "rgb(var(--t-surface) / <alpha-value>)",
        surface2: "rgb(var(--t-surface-2) / <alpha-value>)",
        card: "rgb(var(--t-surface-2) / <alpha-value>)",
        overlay: "rgb(var(--t-overlay) / <alpha-value>)",

        fg: "rgb(var(--t-fg) / <alpha-value>)",
        heading: "rgb(var(--t-heading) / <alpha-value>)",
        muted: "rgb(var(--t-muted) / <alpha-value>)",
        subtle: "rgb(var(--t-subtle) / <alpha-value>)",

        border: "rgb(var(--t-border) / <alpha-value>)",
        border2: "rgb(var(--t-border-2) / <alpha-value>)",
        ring: "rgb(var(--t-ring) / <alpha-value>)",

        primary: {
          DEFAULT: "rgb(var(--t-primary) / <alpha-value>)",
          hover: "rgb(var(--t-primary-hover) / <alpha-value>)",
          fg: "rgb(var(--t-on-primary) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--t-secondary) / <alpha-value>)",
          fg: "rgb(var(--t-on-secondary) / <alpha-value>)",
        },
        info: {
          DEFAULT: "rgb(var(--t-info) / <alpha-value>)",
          fg: "rgb(var(--t-on-info) / <alpha-value>)",
        },
        success: {
          DEFAULT: "rgb(var(--t-success) / <alpha-value>)",
          fg: "rgb(var(--t-on-success) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "rgb(var(--t-warning) / <alpha-value>)",
          fg: "rgb(var(--t-on-warning) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--t-danger) / <alpha-value>)",
          fg: "rgb(var(--t-on-danger) / <alpha-value>)",
        },

        accent: {
          DEFAULT: "rgb(var(--t-accent) / <alpha-value>)",
          fg: "rgb(var(--t-on-accent) / <alpha-value>)",
        },
      },
      backgroundImage: {
        "theme-page": "var(--t-gradient-page)",
        "theme-hero": "var(--t-gradient-hero)",
        "theme-hero-overlay": "var(--t-gradient-hero-overlay)",
        "theme-cta": "var(--t-gradient-cta)",
        "theme-card": "var(--t-gradient-card)",
        "theme-text-brand": "var(--t-gradient-text-brand)",
        "theme-primary": "var(--t-gradient-primary)",
        "theme-success": "var(--t-gradient-success)",
        "theme-secondary": "var(--t-gradient-secondary)",
        "theme-warning": "var(--t-gradient-warning)",
        "theme-danger": "var(--t-gradient-danger)",
        "theme-info": "var(--t-gradient-info)",
      },
      boxShadow: {
        "theme-1": "var(--t-shadow-1)",
        "theme-2": "var(--t-shadow-2)",
        "theme-3": "var(--t-shadow-3)",
        "theme-sm": "var(--t-shadow-1)",
        "theme-md": "var(--t-shadow-2)",
        "theme-lg": "var(--t-shadow-3)",
      },
    },
  },
  plugins: [],
};
