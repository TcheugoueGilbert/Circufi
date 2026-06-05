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
        navy: {
          DEFAULT: '#0A1628',
          50: '#E8EDF5',
        },
        teal: {
          DEFAULT: '#00C896',
          mid:   '#00A07A',
          dark:  '#065F46',
          light: '#E0FAF4',
        },
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'DM Sans', 'sans-serif'],
      },
      borderRadius: {
        pill: '100px',
      },
    },
  },
  plugins: [],
}

export default config