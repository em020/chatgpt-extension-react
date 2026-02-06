import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "node:path"

const rootDir = resolve(__dirname)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(rootDir, "src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        popup: resolve(rootDir, "popup.html"),
        background: resolve(rootDir, "src/background.ts"),
        "content-script": resolve(rootDir, "src/content-script.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
  define: {
    global: "globalThis",
  },
})
