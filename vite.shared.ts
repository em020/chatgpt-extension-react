import { resolve } from "node:path"
import react from "@vitejs/plugin-react"
import type { UserConfig } from "vite"

const rootDir = resolve(__dirname)

export const sharedConfig: UserConfig = {
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(rootDir, "src"),
    },
  },
  define: {
    global: "globalThis",
  },
}

export { rootDir }
