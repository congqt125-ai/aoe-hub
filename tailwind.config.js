import preset from "./tokens/tailwind.preset.js";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: ["./components/**/*.{ts,tsx}", "./demo/*.{ts,tsx,html}", "./demo/{gallery,app,shared}/**/*.{ts,tsx,html}"],
};
