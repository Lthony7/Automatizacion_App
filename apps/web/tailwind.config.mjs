/** @type {import('tailwindcss').Config} */
const withAlpha = (name) => `rgb(var(${name}) / <alpha-value>)`

export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Merriweather', 'Georgia', 'serif'],
      },
      colors: {
        primary: withAlpha('--color-primary'),
        secondary: withAlpha('--color-secondary'),
        accent: withAlpha('--color-accent'),
        background: withAlpha('--color-background'),
        surface: withAlpha('--color-surface'),
        'surface-secondary': withAlpha('--color-surface-secondary'),
        'text-primary': withAlpha('--color-text-primary'),
        'text-secondary': withAlpha('--color-text-secondary'),
        border: withAlpha('--color-border'),
        muted: withAlpha('--color-muted'),
        card: withAlpha('--color-card'),
        success: withAlpha('--color-success'),
        warning: withAlpha('--color-warning'),
        error: withAlpha('--color-error'),
        info: withAlpha('--color-info'),
        sidebar: withAlpha('--color-sidebar'),
        'sidebar-hover': withAlpha('--color-sidebar-hover'),
        'sidebar-text': withAlpha('--color-sidebar-text'),
        'sidebar-border': withAlpha('--color-sidebar-border'),
      },
    },
  },
  plugins: [],
}