import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = env.VITE_API_URL || "http://localhost:8000";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: true,
      port: 5173,
      // Proxy /api/v1 to the FastAPI backend during dev so we don't deal with
      // CORS preflight in development. Production uses the same path through nginx.
      proxy: {
        "/api/v1": {
          target: apiUrl,
          changeOrigin: true,
        },
        "/health": {
          target: apiUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
