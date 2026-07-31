import { describe, expect, it } from "vitest"
import { formatDateTime } from "./date"

// Date en milieu d'année à midi UTC : l'année reste 2026 quel que soit le
// fuseau du runner (pas de bascule de jour/année).
const VALID = "2026-06-15T12:00:00Z"

describe("formatDateTime", () => {
  it("retourne — pour une valeur absente", () => {
    expect(formatDateTime(null, "fr")).toBe("—")
    expect(formatDateTime(undefined, "fr")).toBe("—")
    expect(formatDateTime("", "fr")).toBe("—")
  })

  it("retourne — pour une date invalide", () => {
    expect(formatDateTime("pas-une-date", "fr")).toBe("—")
  })

  it("formate une date valide (contient l'année)", () => {
    const out = formatDateTime(VALID, "fr")
    expect(out).not.toBe("—")
    expect(out).toContain("2026")
  })

  it("applique un format dépendant de la langue", () => {
    // fr → 15/06/2026 …, en → 6/15/2026 … : l'ordre jour/mois diffère.
    expect(formatDateTime(VALID, "fr")).not.toBe(formatDateTime(VALID, "en"))
  })
})
