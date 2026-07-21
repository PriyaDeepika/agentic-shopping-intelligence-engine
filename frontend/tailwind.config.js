/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#14151A",
        canvas: "#F6F4F1",
        panel: "#EFEBE6",
        accent: "#D6603A",
        line: "rgba(20,21,26,0.1)",
      },
      maxWidth: {
        frame: "1440px",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      keyframes: {
        floatY: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        floatY: "floatY 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
