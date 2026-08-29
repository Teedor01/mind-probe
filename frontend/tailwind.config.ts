import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#F6F6FB",
          card: "#FFFFFF",
          sidebar: "#FFFFFF",
          border: "#E8E8F2",
          borderSoft: "#F0F0F7",
        },
        brand: {
          DEFAULT: "#6D5FFB",
          dark: "#5A4CE8",
          soft: "#F0EDFF",
          softer: "#F7F6FF",
        },
        ink: {
          primary: "#16161F",
          secondary: "#40404D",
          muted: "#6B7280",
          faint: "#9CA3AF",
        },
        signal: {
          green: "#22C55E",
          greenSoft: "#ECFDF3",
          greenText: "#15803D",
          orange: "#F59E0B",
          orangeSoft: "#FFFBEB",
          orangeText: "#B45309",
          red: "#EF4444",
          redSoft: "#FEF2F2",
          redText: "#B91C1C",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,16,30,0.04), 0 1px 12px rgba(16,16,30,0.04)",
        cardHover: "0 4px 20px rgba(109,95,251,0.12)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
