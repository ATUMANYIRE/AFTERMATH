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
        app: {
          bg: "#FAF9F6",
          surface: "#FFFFFF",
          text: "#172033",
          secondary: "#667085",
          accent: "#3558D4",
          hover: "#2846B4",
          border: "#DCE2EB",
          success: "#168568",
          warning: "#D78A43",
          error: "#C74747",
        },
        ivory: {
          50: "#FAF9F6",
          100: "#F5F4EE",
          200: "#EAE6DC",
          300: "#DCE2EB",
        },
        ink: {
          950: "#172033",
          900: "#1F293D",
          700: "#3A465D",
          500: "#667085",
        },
        brand: {
          50: "#EFF4FE",
          100: "#DBE7FD",
          200: "#BFD5FB",
          500: "#3558D4",
          600: "#2846B4",
          700: "#1E3593",
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(23, 32, 51, 0.04), 0 1px 2px -1px rgba(23, 32, 51, 0.02)",
        "card-hover": "0 4px 6px -1px rgba(23, 32, 51, 0.06), 0 2px 4px -2px rgba(23, 32, 51, 0.04)",
        popover: "0 10px 15px -3px rgba(23, 32, 51, 0.08), 0 4px 6px -4px rgba(23, 32, 51, 0.04)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "'SFMono-Regular'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
