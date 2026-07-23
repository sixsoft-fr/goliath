import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { configDefaults, defineConfig } from "vitest/config"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    // Base URL for the ky client during tests, so relative calls (e.g.
    // "auth/refresh") resolve. Requests in tests mock fetch by pathname.
    env: { VITE_API_URL: "http://api.test" },
    // e2e/ holds Playwright specs (see playwright.config.ts) which use
    // @playwright/test's test() runner and must not be picked up by Vitest.
    exclude: [...configDefaults.exclude, "e2e/**"],
    // Keep exit 0 when a filter matches no files.
    passWithNoTests: true,
  },
})
