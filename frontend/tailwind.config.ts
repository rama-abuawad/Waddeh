import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#18302a",
        paper: "#faf8f2",
        sage: "#dce9df",
        teal: "#0e6b5c",
        mint: "#41b78c",
      },
      fontFamily: { sans: ["Tahoma", "Arial", "sans-serif"] },
    },
  },
  plugins: [],
};

export default config;
