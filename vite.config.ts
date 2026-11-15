import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Root is the project so components, tokens/ and assets/ui/ resolve by relative path.
export default defineConfig({
  plugins: [react()],
  base: "./",
  publicDir: false,
  server: { open: "/demo/app/" },
  build: {
    outDir: "dist",
    // Keep game sprites as files (no base64 in CSS / JS): smaller bundles, cacheable in Electron.
    assetsInlineLimit: 0,
    rollupOptions: { input: { demo: "demo/index.html", app: "demo/app/index.html" } },
  },
});
