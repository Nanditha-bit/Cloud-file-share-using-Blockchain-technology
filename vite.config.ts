// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// -----------------------------------------
// 🧭 Vite Configuration for SecureVault
// -----------------------------------------
// - Uses React (with SWC for faster builds)
// - Custom alias for "@/src"
// - Runs on port 8080

// -----------------------------------------

export default defineConfig({
  // ⚙️ Dev server settings
  server: {
    host: "::", // allows local network access (e.g., mobile preview)
    port: 5173, // change if needed
  },

  // 🧩 Plugins
  plugins: [react()],

  // 🛣️ Resolve path aliases (lets you use "@/...")
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // 🚀 Build options
  build: {
    outDir: "dist", // production output folder
    sourcemap: true, // helpful for debugging
  },
});

