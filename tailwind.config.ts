import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          0: "#07070d",
          1: "#0d0d15",
          2: "#111118",
          3: "#18181f",
          4: "#1e1e28",
          5: "#252530",
        },
        brand: {
          DEFAULT: "#22c55e",
          dim: "#16a34a",
        },
        border: {
          DEFAULT: "#2a2a38",
          light: "#323244",
        },
        muted: "#8888a8",
        dim: "#5a5a78",
      },
      fontFamily: {
        syne: ["var(--font-syne)", "sans-serif"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        spin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s ease both",
        shimmer: "shimmer 1.5s infinite linear",
        spin: "spin 1s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
