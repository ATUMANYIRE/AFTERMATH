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
          bg: "#F7F8FA",
          surface: "#FFFFFF",
          text: "#111827",
          secondary: "#6B7280",
          accent: "#F97316",
          hover: "#EA580C",
          border: "#E5E7EB",
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
        },
        brand: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
        },
        slate: {
          950: "#0F172A",
          900: "#111827",
          800: "#1F2937",
          700: "#374151",
          600: "#4B5563",
          500: "#6B7280",
          400: "#9CA3AF",
          300: "#D1D5DB",
          200: "#E5E7EB",
          100: "#F3F4F6",
          50: "#F9FAFB",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(0, 0, 0, 0.02), 0 4px 16px -2px rgba(0, 0, 0, 0.03)",
        "card-hover": "0 2px 4px rgba(0, 0, 0, 0.02), 0 8px 24px -4px rgba(0, 0, 0, 0.05)",
        popover: "0 10px 30px -5px rgba(0, 0, 0, 0.08)",
        pill: "0 1px 2px rgba(0, 0, 0, 0.05)",
      },
      borderRadius: {
        xl: "0.75rem",
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
