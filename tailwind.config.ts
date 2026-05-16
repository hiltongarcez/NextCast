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
        background: "#0a0c10",
        surface: "#111318",
        "surface-2": "#1a1d24",
        border: "#1e2330",
        accent: "#00c2ff",
        "accent-dim": "#0099cc",
        "accent-glow": "rgba(0, 194, 255, 0.15)",
        muted: "#4a5568",
        "text-primary": "#e8eaf0",
        "text-secondary": "#8892a4",
        success: "#00d48a",
        warning: "#f5a623",
        error: "#ff4757",
      },
      fontFamily: {
        syne: ["var(--font-syne)", "sans-serif"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 194, 255, 0.2)",
        "glow-lg": "0 0 40px rgba(0, 194, 255, 0.3)",
        card: "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px #1e2330",
      },
      backgroundImage: {
        "gradient-accent":
          "linear-gradient(135deg, #00c2ff 0%, #0066ff 100%)",
        "gradient-surface":
          "linear-gradient(180deg, #111318 0%, #0a0c10 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
