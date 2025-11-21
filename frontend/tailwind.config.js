/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", 
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },
      screens: {
        tablet: { min: "768px", max: "1023px" }, // custom tablet breakpoint
      },
    },
  },
  plugins: [],
};
