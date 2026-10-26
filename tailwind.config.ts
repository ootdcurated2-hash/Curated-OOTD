import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-jakarta)", "Plus Jakarta Sans", "sans-serif"],
        nunito: ["var(--font-nunito)", "Nunito", "sans-serif"],
        jakarta: ["var(--font-jakarta)", "Plus Jakarta Sans", "sans-serif"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        cartoon: {
          cream: "#FFFAFC",
          coral: "#FF4FA8",
          teal: "#00CCFF",
          yellow: "#FFCC00",
          purple: "#C87DB8",
          mint: "#FFE0EE",
          peach: "#FFE9F1",
          lavender: "#FBE9F6",
          sky: "#EDE4FF",
          dark: "#321A28",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        cartoon: "0 8px 32px -4px rgba(255, 79, 168, 0.15)",
        "cartoon-sm": "0 4px 12px -2px rgba(255, 79, 168, 0.12)",
        "cartoon-lg": "0 20px 40px -12px rgba(255, 79, 168, 0.25)",
        "cartoon-btn": "0 8px 20px -6px rgba(255, 79, 168, 0.4)",
        "3d-card":
          "0 1px 0 rgba(255,255,255,0.85) inset, 0 14px 28px -10px rgba(255, 79, 168, 0.22), 0 28px 56px -20px rgba(50, 26, 40, 0.12)",
        "3d-lift": "0 20px 40px -12px rgba(255, 79, 168, 0.28), 0 40px 80px -24px rgba(50, 26, 40, 0.14)",
        "3d-btn":
          "0 5px 0 rgba(255, 31, 143, 0.38), 0 12px 24px -6px rgba(255, 79, 168, 0.45)",
        "3d-btn-press": "0 2px 0 rgba(255, 31, 143, 0.45), 0 4px 12px -4px rgba(255, 79, 168, 0.35)",
      },
      perspective: {
        scene: "1400px",
        card: "900px",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
