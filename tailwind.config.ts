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
        // SpendHub Design Tokens
        spend: {
          bg: "#F8F9FB",
          sidebar: "#F9FAFB",
          surface: "#FFFFFF",
          text: "#191C24",
          secondary: "#747B87",
          muted: "#969CA6",
          border: "#ECEEF1",
          search: "#F0F1F3",
          orange: "#FF6A13",
          orangeSubtle: "#FFF5EC",
          green: "#22C55E",
          buttonDark: "#20242D",
        },
        app: {
          bg: "#F8F9FB",
          sidebar: "#F9FAFB",
          surface: "#FFFFFF",
          text: "#191C24",
          secondary: "#747B87",
          muted: "#969CA6",
          border: "#ECEEF1",
          search: "#F0F1F3",
          accent: "#FF6A13",
          accentSubtle: "#FFF5EC",
          success: "#22C55E",
          buttonDark: "#20242D",
          warning: "#F59E0B",
          error: "#EF4444",
        },
        brand: {
          50: "#FFF5EC",
          100: "#FFE8D5",
          200: "#FED1AA",
          500: "#FF6A13",
          600: "#EA580C",
          700: "#C2410C",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.02), 0 4px 12px rgba(0, 0, 0, 0.015)",
        "card-hover": "0 2px 6px rgba(0, 0, 0, 0.03), 0 8px 20px rgba(0, 0, 0, 0.025)",
        pill: "0 1px 2px rgba(0, 0, 0, 0.04)",
        dropdown: "0 4px 16px rgba(0, 0, 0, 0.06)",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Inter'",
          "'SF Pro Display'",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "'SFMono-Regular'",
          "'JetBrains Mono'",
          "ui-monospace",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
