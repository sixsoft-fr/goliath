import { defineConfig } from "i18next-cli"

// Per-module namespaces: useTranslation('<module>') maps to
// src/modules/<module>/locales/<lng>.json. Run `npx i18next-cli extract` to
// pull hardcoded t()/Trans keys out of the code and write them here.
export default defineConfig({
  locales: ["fr", "en"],
  extract: {
    input: ["src/**/*.{ts,tsx}"],
    output: (language, namespace) =>
      `src/modules/${namespace ?? "core"}/locales/${language}.json`,
    defaultNS: "core",
  },
})
