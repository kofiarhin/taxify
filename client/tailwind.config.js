/** @type {import('tailwindcss').Config} */
export default {
  content: {
    relative: true,
    files: ['./index.html', './src/**/*.{js,jsx,ts,tsx}']
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['Satoshi', 'Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      colors: {
        ink: '#18181b',
        accent: '#0f766e'
      }
    }
  },
  plugins: []
};
