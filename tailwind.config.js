/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        mute: "rgb(var(--mute) / <alpha-value>)",
        brand: "rgb(var(--brand) / <alpha-value>)",
        "brand-fg": "rgb(var(--brand-fg) / <alpha-value>)",
        foreground: "rgb(var(--ink) / <alpha-value>)",
        canvas: "rgb(var(--bg) / <alpha-value>)",
        "surface-hover": "rgb(var(--line) / <alpha-value>)",
        ok: "#16A34A", warn: "#F59E0B", danger: "#DC2626",
      },
      fontFamily: {
        sans: ['"Segoe UI Variable"', '"Segoe UI"', "system-ui", "-apple-system", "Roboto", "sans-serif"],
        mono: ['"Cascadia Mono"', "ui-monospace", "Consolas", "monospace"],
      },
      borderRadius: { card: "10px" },
    },
  },
  plugins: [],
};
