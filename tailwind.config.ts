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
        neon: {
          DEFAULT: "#00E87A",
          bright: "#00FF87",
          dim: "#00B85E",
          muted: "rgba(0,232,122,0.15)",
          glow: "rgba(0,232,122,0.3)",
        },
        void: {
          DEFAULT: "#060608",
          50: "#0D0D12",
          100: "#111118",
          200: "#16161F",
          300: "#1C1C27",
          400: "#242432",
        },
        surface: {
          DEFAULT: "#0D0D12",
          raised: "#111118",
          overlay: "#16161F",
          border: "rgba(255,255,255,0.06)",
          "border-neon": "rgba(0,232,122,0.18)",
        },
        text: {
          primary: "#F0F0F5",
          secondary: "#9090A8",
          muted: "#555568",
          neon: "#00E87A",
        },
        status: {
          pending: "#F59E0B",
          "in-progress": "#3B82F6",
          submitted: "#8B5CF6",
          approved: "#00E87A",
          revision: "#EF4444",
        },
      },
      fontFamily: {
        display: ["Rajdhani", "sans-serif"],
        body: ["Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "2xs": "0.625rem",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(0,232,122,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,232,122,0.03) 1px, transparent 1px)",
        "neon-gradient":
          "linear-gradient(135deg, #00E87A 0%, #00FF87 50%, #00B85E 100%)",
        "card-gradient":
          "linear-gradient(135deg, rgba(0,232,122,0.05) 0%, rgba(0,0,0,0) 100%)",
        "hero-gradient":
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,232,122,0.12) 0%, transparent 60%)",
      },
      backgroundSize: {
        grid: "32px 32px",
      },
      boxShadow: {
        neon: "0 0 20px rgba(0,232,122,0.35), 0 0 60px rgba(0,232,122,0.15)",
        "neon-sm": "0 0 10px rgba(0,232,122,0.25)",
        "neon-lg": "0 0 40px rgba(0,232,122,0.4), 0 0 100px rgba(0,232,122,0.15)",
        card: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
        "card-hover":
          "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,232,122,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
        "inset-neon": "inset 0 0 30px rgba(0,232,122,0.05)",
      },
      animation: {
        "pulse-neon": "pulseNeon 2s ease-in-out infinite",
        "scan-line": "scanLine 3s linear infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-right": "slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        glow: "glow 2s ease-in-out infinite alternate",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        pulseNeon: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        glow: {
          from: { boxShadow: "0 0 10px rgba(0,232,122,0.2)" },
          to: { boxShadow: "0 0 30px rgba(0,232,122,0.5), 0 0 60px rgba(0,232,122,0.2)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      borderRadius: {
        "4xl": "2rem",
      },
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [],
};
export default config;
