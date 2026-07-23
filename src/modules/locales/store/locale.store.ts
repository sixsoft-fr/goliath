import { create } from "zustand"
import i18n from "@/lib/i18n"
import type { Locale } from "../locales.enum"

interface LocaleStore {
  locale: Locale
  setLocale: (locale: Locale) => void
}

// i18next is the single source of truth for the active language (it persists to
// localStorage via the language detector). This store just mirrors it so
// components can subscribe the zustand way; setLocale delegates to i18n.
export const useLocaleStore = create<LocaleStore>((set) => {
  i18n.on("languageChanged", (lng) => set({ locale: lng as Locale }))
  return {
    locale: (i18n.language as Locale) ?? "fr",
    setLocale: (locale) => void i18n.changeLanguage(locale),
  }
})
