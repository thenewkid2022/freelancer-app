import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#42a5f5',
          DEFAULT: '#1976d2',
          dark: '#1565c0',
        },
        secondary: {
          light: '#ba68c8',
          DEFAULT: '#9c27b0',
          dark: '#7b1fa2',
        },
        background: {
          light: '#f5f5f5',
          DEFAULT: '#ffffff',
          dark: '#121212',
        },
        text: {
          light: 'rgba(0, 0, 0, 0.87)',
          DEFAULT: 'rgba(0, 0, 0, 0.6)',
          dark: 'rgba(255, 255, 255, 0.7)',
        },
      },
      transitionDuration: {
        DEFAULT: '300ms',
      },
      boxShadow: {
        'card': '0 2px 4px rgba(0,0,0,0.1)',
        'card-dark': '0 2px 4px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
};

export default config; 