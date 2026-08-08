/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      colors: {
        main: 'rgb(var(--bg-main) / <alpha-value>)',
        surface: 'rgb(var(--bg-surface) / <alpha-value>)',
        primary: 'rgb(var(--text-primary) / <alpha-value>)',
        secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
        muted: 'rgb(var(--text-muted) / <alpha-value>)',
        border: 'rgb(var(--border-color) / <alpha-value>)',
        brand: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          hover: 'rgb(var(--color-accent-hover) / <alpha-value>)',
        },
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        danger: {
          DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
          hover: 'rgb(var(--color-danger-hover) / <alpha-value>)',
        }
      },
      textColor: {
        primary: 'rgb(var(--text-primary) / <alpha-value>)',
        secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
        muted: 'rgb(var(--text-muted) / <alpha-value>)',
      },
      backgroundColor: {
        main: 'rgb(var(--bg-main) / <alpha-value>)',
        surface: 'rgb(var(--bg-surface) / <alpha-value>)',
      },
      borderColor: {
        DEFAULT: 'rgb(var(--border-color) / <alpha-value>)',
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        DEFAULT: '0.375rem', /* 6px */
        'md': '0.375rem', /* 6px */
        'lg': '0.5rem', /* 8px */
        'xl': '0.75rem', /* 12px */
        '2xl': '1rem',
        '3xl': '1.5rem',
        'full': '9999px',
      }
    },
  },
  plugins: [],
};
