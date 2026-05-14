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
    build: {
      target: "es2020",
      sourcemap: false,
      // Heavy libs get their own chunks so the initial route only pays for what
      // it actually renders. Recharts (~250KB) and Radix live behind feature
      // pages, not the auth screens.
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            query: ["@tanstack/react-query", "zustand"],
            forms: ["react-hook-form", "@hookform/resolvers", "zod"],
            charts: ["recharts"],
            radix: [
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-label",
              "@radix-ui/react-select",
              "@radix-ui/react-separator",
              "@radix-ui/react-slot",
            ],
            icons: ["lucide-react"],
          },
        },
      },
      chunkSizeWarningLimit: 700,
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
