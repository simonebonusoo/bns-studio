/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#0b0b0c" },
      boxShadow: { soft: "0 30px 80px rgba(0,0,0,.55)", card: "0 12px 40px rgba(0,0,0,.55)" },
      keyframes: {
        floaty: { "0%,100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-10px)" } },
      },
      animation: { floaty: "floaty 6s ease-in-out infinite" }
    },
  },
  plugins: [],
}
