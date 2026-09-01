/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        water: {
          50: "#eff9ff",
          100: "#dcf1ff",
          200: "#b3e4ff",
          300: "#75d0ff",
          400: "#2fb6ff",
          500: "#0399f2",
          600: "#0079cf",
          700: "#0161a8",
          800: "#06528a",
          900: "#0a4471",
          950: "#062b4a",
        },
      },
    },
  },
  plugins: [],
};
