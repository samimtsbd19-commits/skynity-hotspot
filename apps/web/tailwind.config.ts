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
        sky: {
          bg: {
            primary: "#050B15",
            secondary: "#0A1628",
            card: "#0D1E36",
            elevated: "#112240",
          },
          accent: {
            primary: "#00EAFF",
            green: "#00FF88",
            orange: "#FF8C00",
            red: "#FF3B6B",
            purple: "#A855F7",
          },
          text: {
            primary: "#E2F0FF",
            secondary: "#7AA3C8",
          },
        },
      },
      fontFamily: {
        orbitron: ["Orbitron", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        pulse: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(0,234,255,0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(0,234,255,0.6), 0 0 40px rgba(0,234,255,0.3)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
