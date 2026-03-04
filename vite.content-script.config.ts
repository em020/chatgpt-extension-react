import { defineConfig, mergeConfig } from "vite"
import { resolve } from "node:path"
import { sharedConfig, rootDir } from "./vite.shared"

export default defineConfig(
  mergeConfig(sharedConfig, {
    build: {
      lib: {
        entry: resolve(rootDir, "src/content-script.ts"),
        formats: ["iife"],
        fileName: () => "content-script.js",
        name: "ChatExtensionContentScript",
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
