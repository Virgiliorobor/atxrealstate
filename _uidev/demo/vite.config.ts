import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://127.0.0.1:19877", changeOrigin: true },
    },
  },
  build: { outDir: "dist/client", emptyOutDir: true },
});
