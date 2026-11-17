import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// VocabMaster standalone frontend.
// Dev: `npm run dev` serves on :5173 and proxies /api to the backend (:4000),
// so the client can call a relative /api base in dev and in production
// (when the backend serves the built client). For a separately hosted
// frontend (Vercel/Netlify), set VITE_API_URL to the backend URL instead.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
  },
});
