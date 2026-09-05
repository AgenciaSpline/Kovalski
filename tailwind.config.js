/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
      },
      keyframes: {
        "spit-text": {
          "0%": { transform: "translateY(-40px) scale(0.2)", opacity: "0" },
          "50%": { transform: "translateY(10px) scale(1.1)", opacity: "1" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" }
        },
        "penguin-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "20%": { transform: "translateY(-15px)" },
          "40%": { transform: "translateY(5px)" },
          "60%": { transform: "translateY(-5px)" }
        }
      },
      animation: {
        "spit-text": "spit-text 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
        "penguin-bounce": "penguin-bounce 0.8s ease-in-out"
      }
    },
  },
  plugins: [],
}
