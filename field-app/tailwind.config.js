/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        aegis: {
          "primary": "#0ea5e9",
          "secondary": "#7c3aed",
          "accent": "#f59e0b",
          "neutral": "#1f2937",
          "base-100": "#111827",
          "base-200": "#1f2937",
          "base-300": "#374151",
          "info": "#3b82f6",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
        aegisLight: {
          "primary": "#0284c7",
          "secondary": "#7c3aed",
          "accent": "#f59e0b",
          "neutral": "#1f2937",
          "base-100": "#f8fafc",
          "base-200": "#e2e8f0",
          "base-300": "#cbd5e1",
          "info": "#3b82f6",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
      "dark",
      "light",
    ],
    darkTheme: "aegis",
  },
}
