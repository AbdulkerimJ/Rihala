/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Inter", "sans-serif"],
      },

      // 1. Universal Interactive & Semantic Colors (Buttons, Badges, Borders, Focus Rings)
      colors: {
        brand: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          hover: "rgb(var(--color-primary-hover) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          hover: "rgb(var(--color-accent-hover) / <alpha-value>)",
        },
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        danger: {
          DEFAULT: "rgb(var(--color-danger) / <alpha-value>)",
          hover: "rgb(var(--color-danger-hover) / <alpha-value>)",
        },
        border: "rgb(var(--border-color) / <alpha-value>)",
        status: {
          pending: "rgb(var(--color-status-pending) / <alpha-value>)",
          processing: "rgb(var(--color-status-processing) / <alpha-value>)",
          shipped: "rgb(var(--color-status-shipped) / <alpha-value>)",
          delivered: "rgb(var(--color-status-delivered) / <alpha-value>)",
          cancelled: "rgb(var(--color-status-cancelled) / <alpha-value>)",
          completed: "rgb(var(--color-status-completed) / <alpha-value>)",
        },
        finance: {
          in: "rgb(var(--color-finance-in) / <alpha-value>)",
          out: "rgb(var(--color-finance-out) / <alpha-value>)",
        },
      },

      // 2. Text Typography Hierarchy ONLY
      textColor: {
        primary: "rgb(var(--text-primary) / <alpha-value>)",
        secondary: "rgb(var(--text-secondary) / <alpha-value>)",
        muted: "rgb(var(--text-muted) / <alpha-value>)",
      },

      // 3. Background Canvas & Card Surfaces ONLY
      backgroundColor: {
        main: "rgb(var(--bg-main) / <alpha-value>)",
        surface: "rgb(var(--bg-surface) / <alpha-value>)",
      },

      // 4. Default Border Color Shortcut
      borderColor: {
        DEFAULT: "rgb(var(--border-color) / <alpha-value>)",
      },

      borderRadius: {
        none: "0",
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        full: "9999px",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
        sm: "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)",
        DEFAULT:
          "0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
        md: "0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
        lg: "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.03)",
      },
      keyframes: {
        shimmer: {
          "100%": {
            transform: "translateX(100%)",
          },
        },
      },
    },
  },
  plugins: [],
};
