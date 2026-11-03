/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gdgBlue: "#4285F4",
        gdgRed: "#EA4335",
        gdgYellow: "#FBBC05",
        gdgGreen: "#34A853",
        motihariSand: "#FFFBF0",
        motihariCream: "#FFF8E7",
        ranchiSand: "#FFFBF0",
        ranchiCream: "#FFF8E7",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        'neo-sm': '2px 2px 0 0 #000',
        'neo': '4px 4px 0 0 #000',
        'neo-lg': '6px 6px 0 0 #000',
        'neo-xl': '8px 8px 0 0 #000',
        'neo-blue': '4px 4px 0 0 #4285F4',
      },
    },
  },
  plugins: [],
};
