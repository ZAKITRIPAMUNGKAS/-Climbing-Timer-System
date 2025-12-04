/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'rich-black': '#0a0a0a',
        'gunmetal': '#1a1a1a',
        'crimson': '#E11D23',
        'goldenrod': '#FFC107',
        'off-white': '#F5F5F5',
      },
      fontFamily: {
        'heading': ['Montserrat', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
        'mono': ['Chakra Petch', 'monospace'],
      },
    },
  },
  plugins: [],
}

