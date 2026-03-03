import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#047857",
        secondary: "#14B8A6",
        accent: "#FBBF24",
        organic: "#10B981",
      },
    },
  },
  plugins: [],
};
export default config;
