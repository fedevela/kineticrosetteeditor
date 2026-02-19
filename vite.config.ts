import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/@pixi/react")) {
            return "pixi-react";
          }

          if (id.includes("node_modules/pixi.js") || id.includes("node_modules/@pixi")) {
            return "pixi-vendor";
          }

          if (id.includes("node_modules/@radix-ui") || id.includes("node_modules/lucide-react")) {
            return "ui-vendor";
          }

          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/react-router")) {
            return "react-vendor";
          }

          if (id.includes("node_modules/zustand") || id.includes("node_modules/immer")) {
            return "state-vendor";
          }
        },
      },
    },
  },
});