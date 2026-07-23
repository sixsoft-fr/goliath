import i18n from "i18next"
import type { BackendModule, ReadCallback } from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { Locales } from "@/modules/locales/locales.enum"
import { matchLocaleKey } from "./locale-loader"

// Every module's locale JSON, lazily importable. Vite splits each file into its
// own chunk, so a namespace is fetched over the network only when a component
// first calls useTranslation('<module>'). This is the per-namespace lazy-load.
const loaders = import.meta.glob("../modules/*/locales/*.json") as Record<
  string,
  () => Promise<{ default: Record<string, unknown> }>
>

const keys = Object.keys(loaders)

// Custom backend: resolve (language, namespace) to its lazy import.
const backend: BackendModule = {
  type: "backend",
  init: () => {},
  read: (lng, ns, callback: ReadCallback) => {
    const key = matchLocaleKey(keys, ns, lng)
    // Missing file: resolve empty so the module simply has no translations for
    // this locale (keys fall back to fallbackLng). Not an error worth raising.
    if (!key) return callback(null, {})
    loaders[key]().then(
      (mod) => callback(null, mod.default),
      (err: unknown) => callback(err as Error, null),
    )
  },
}

export const supportedLngs = [Locales.FR, Locales.EN]

i18n
  .use(backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: Locales.FR,
    supportedLngs,
    load: "languageOnly", // fr-FR -> fr
    ns: [], // nothing at boot; each module pulls its own namespace on demand
    defaultNS: false, // convention: always useTranslation('<module>')
    interpolation: { escapeValue: false }, // React already escapes
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  })

export default i18n
