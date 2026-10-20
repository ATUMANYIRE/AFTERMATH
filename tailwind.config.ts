import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: "#FDFBF7",
          100: "#F7F4ED",
          200: "#ECE6DA",
          300: "#DDD4C3",
        },
        ink: {
          950: "#0F172A",
          900: "#1E293B",
          700: "#334155",
          500: "#64748B",
        },
        signal: {
          crimson: "#BE123C",
          amber: "#B45309",
          emerald: "#047857",
          cobalt: "#1D4ED8",
        },
      },
      fontFamily: {
        serif: ["'Instrument Serif'", "'Newsreader'", "Georgia", "Cambria", "serif"],
        sans: ["'Inter'", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
