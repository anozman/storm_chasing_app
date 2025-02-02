import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
  define: {
    "process.env.WILL_READ_FREQUENTLY": "true", // ✅ Improves heatmap canvas performance
  },
});
