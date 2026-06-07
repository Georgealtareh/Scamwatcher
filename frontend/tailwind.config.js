/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0056b3",
        secondary: "#6c757d",
        safety: "#28a745", // guidelines call it safety green
        alert: "#dc3545",  // guidelines call it alert red
        warning: "#ffc107",
        background: "#f8f9fa",
        dark: "#212529",
      },
      fontFamily: {
        sans: ["Inter", "Roboto", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
      },
      fontSize: {
        'base': '18px',
        'heading': '24px',
        'hero': '36px',
      },
      maxWidth: {
        'container': '1000px',
      }
    },
  },
  plugins: [],
}
