/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sentinel: {
          bg: '#070b14',
          panel: '#0e1524',
          panelAlt: '#131b2e',
          border: '#1f2a40',
          accent: '#22d3ee',
          accent2: '#34d399',
          text: '#e6ecf5',
          muted: '#8b9ab3',
          critical: '#f87171',
          high: '#fb923c',
          medium: '#facc15',
          low: '#60a5fa',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(34,211,238,0.15), 0 0 24px rgba(34,211,238,0.08)',
      },
    },
  },
  plugins: [],
};
