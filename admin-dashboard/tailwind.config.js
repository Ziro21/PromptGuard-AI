export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0B1120',      // Deep space background
          surface: '#1E293B',   // Slate 800 - Cards
          border: '#334155',    // Slate 700 - Subdued borders
          blue: '#3B82F6',      // Primary Blue
          glow: '#60A5FA',      // Light Blue Accent
          cyan: '#06B6D4'       // Secondary Accent
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
}
