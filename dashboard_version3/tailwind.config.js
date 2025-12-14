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
        aegisDashboardLight: {
          "primary": "#2563eb",
          "secondary": "#7c3aed",
          "accent": "#f59e0b",
          "neutral": "#64748b",
          "base-100": "#f8fafc",
          "base-200": "#f1f5f9",
          "base-300": "#e2e8f0",
          "info": "#3b82f6",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
        aegisDashboard: {
          "primary": "#0ea5e9",
          "secondary": "#7c3aed",
          "accent": "#f59e0b",
          "neutral": "#1f2937",
          "base-100": "#0f172a",
          "base-200": "#1e293b",
          "base-300": "#334155",
          "info": "#3b82f6",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
      "dark",
      "light",
    ],
    darkTheme: "aegisDashboard",
  },
}
