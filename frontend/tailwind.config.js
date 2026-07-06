/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'gp-forest':  '#1B4332',
        'gp-emerald': '#2D6A4F',
        'gp-jade':    '#40916C',
        'gp-mint':    '#74C69D',
        'gp-foam':    '#D8F3DC',
        'gp-earth':   '#8B4513',
        'gp-amber':   '#F4A261',
        'gp-crimson': '#E63946',
        'gp-slate':   '#1A1A2E',
        'gp-grey':    '#6B7280',
        'gp-white':   '#FAFFFE',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
