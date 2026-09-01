/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Teal-forward "water gauge" palette (replaces the generic sky-blue scale)
        water: {
          50: "#EEF6F6",
          100: "#DCEEEE",
          200: "#B9DDDD",
          300: "#8FC7C8",
          400: "#4FC3BE",
          500: "#1C8C93",
          600: "#0E5A68",
          700: "#0A4B57",
          800: "#08404A",
          900: "#062F37",
          950: "#041F24",
        },
        ink: {
          DEFAULT: "#12242B",
          soft: "#5B6E71",
        },
        paper: "#F3F7F6",
        line: {
          DEFAULT: "#D8E3E1",
          strong: "#B9CBC9",
        },
        moss: "#4B8F6B",
        clay: "#D98E2B",
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};
