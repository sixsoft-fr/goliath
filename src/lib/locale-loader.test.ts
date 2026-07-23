import { expect, test } from "vitest"
import { matchLocaleKey } from "./locale-loader"

const keys = [
  "../modules/auth/locales/fr.json",
  "../modules/auth/locales/en.json",
  "../modules/wms/locales/fr.json",
]

test("matches the right module + language", () => {
  expect(matchLocaleKey(keys, "auth", "fr")).toBe(
    "../modules/auth/locales/fr.json",
  )
  expect(matchLocaleKey(keys, "wms", "fr")).toBe(
    "../modules/wms/locales/fr.json",
  )
})

test("returns undefined when the file does not exist", () => {
  expect(matchLocaleKey(keys, "wms", "en")).toBeUndefined()
  expect(matchLocaleKey(keys, "unknown", "fr")).toBeUndefined()
})
