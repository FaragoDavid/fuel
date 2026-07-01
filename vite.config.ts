import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  base: mode === "production" ? "/fuel/" : "/",
  root: "src",
  envDir: "..",
  publicDir: "../public",
  build: {
    outDir: "../docs",
    emptyOutDir: true,
  },
  server: {
    port: 5174,
  },
}));
