import { defineConfig, mergeConfig } from "vite"
import { resolve } from "node:path"
import { sharedConfig, rootDir } from "./vite.shared"

export default defineConfig(
  mergeConfig(sharedConfig, {
    build: {
      lib: {
        entry: resolve(rootDir, "src/background.ts"),
        formats: ["iife"],
        fileName: () => "background.js",
        name: "ChatExtensionBackground",
      },
      outDir: "dist",
      emptyOutDir: false,
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  })
)
