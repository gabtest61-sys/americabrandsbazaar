import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Deep navy blue from logo badge
        navy: {
          DEFAULT: '#1e3a5f',
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#b3c5d9',
          300: '#8da8c6',
          400: '#678bb3',
          500: '#416e9f',
          600: '#345880',
          700: '#274260',
          800: '#1e3a5f',
          900: '#0f1d30',
          950: '#080e18',
        },
        // Warm antique gold from logo text
        gold: {
          DEFAULT: '#c9a227',
          50: '#faf6e8',
          100: '#f3eacc',
          200: '#e7d599',
          300: '#dbc066',
          400: '#d4ac3d',
          500: '#c9a227',
          600: '#a1821f',
          700: '#796117',
          800: '#51410f',
          900: '#282008',
        },
        // Parchment cream from logo background
        cream: {
          DEFAULT: '#f5f0e1',
          50: '#fdfcf9',
          100: '#faf8f2',
          200: '#f5f0e1',
          300: '#ebe5d5',
          400: '#d9d0bc',
          500: '#c7bba3',
        },
        // Patriotic red from ribbon
        patriot: {
          red: '#b22234',
          blue: '#3c3b6e',
          white: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'fabric-texture': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0V0zm10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm20 0a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM10 37a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm10-17h20v20H20V20zm10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14z' fill='%23d4af37' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E\")",
        'subtle-grid': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      borderRadius: {
        'badge': '9999px',
      },
    },
  },
  plugins: [],
}

export default config
