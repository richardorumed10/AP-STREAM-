import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    https: false,
    proxy: {
      "/api": {
        target: "https://ap-stream-3.onrender.com",
        changeOrigin: true
      },
      "/uploads": {
        target: "https://ap-stream-3.onrender.com",
        changeOrigin: true
      }
    }
  }
});
