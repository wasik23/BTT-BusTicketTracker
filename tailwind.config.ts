import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0d9488',
          dark: '#0f766e',
          light: '#14b8a6'
        }
      }
    }
  },
  plugins: []
};

export default config;
