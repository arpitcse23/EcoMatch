/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        eco: {
          surface: "#fafaf9",
          card: "#ffffff",
          sage: "#5a7c59",
          mint: "#6ee7b7",
          emerald: "#10b981",
          soft: "#ecfdf5",
          border: "#d1fae5",
        },
        warm: {
          50: "#fafaf9",
          100: "#f5f5f4",
          200: "#e7e5e4",
        },
      },
      borderRadius: {
        "eco": "1.25rem",
        "eco-lg": "1.5rem",
        "eco-xl": "1.75rem",
      },
      boxShadow: {
        "eco-sm": "0 2px 12px -4px rgba(16, 185, 129, 0.12), 0 4px 16px -6px rgba(0,0,0,0.06)",
        "eco": "0 8px 30px -8px rgba(16, 185, 129, 0.15), 0 12px 40px -12px rgba(0,0,0,0.08)",
        "eco-lg": "0 20px 50px -16px rgba(16, 185, 129, 0.18), 0 24px 60px -16px rgba(0,0,0,0.1)",
        "eco-glow": "0 0 40px -8px rgba(16, 185, 129, 0.35)",
        "eco-glow-soft": "0 0 60px -12px rgba(16, 185, 129, 0.2)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 20px -4px rgba(16, 185, 129, 0.4)" },
          "50%": { opacity: "0.9", boxShadow: "0 0 28px -2px rgba(16, 185, 129, 0.5)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.15)" },
        },
        "progress-ring": {
          "0%": { strokeDashoffset: "283" },
          "100%": { strokeDashoffset: "var(--ring-offset, 70)" },
        },
        "spark-draw": {
          "0%": { strokeDashoffset: "120" },
          "100%": { strokeDashoffset: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out forwards",
        "glow-pulse": "glow-pulse 2.5s ease-in-out infinite",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "progress-ring": "progress-ring 1.2s ease-out forwards",
        "spark-draw": "spark-draw 1.5s ease-out forwards",
        "float": "float 4s ease-in-out infinite",
      },
      transitionDuration: {
        "250": "250ms",
        "400": "400ms",
      },
    },
  },
  plugins: [],
};
