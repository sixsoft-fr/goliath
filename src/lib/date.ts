/**
 * Formate une date/heure selon la locale (via `Intl` — ordre et séparateurs
 * corrects par langue : `15/01/2026 10:00` en `fr`, `1/15/2026, 10:00 AM` en `en`).
 * Retourne `"—"` pour une valeur absente ou invalide.
 *
 * `locale` provient de l'i18n courant (`i18n.language`) — passé par l'appelant
 * pour garder cette fonction pure et testable.
 */
export function formatDateTime(value: unknown, locale: string): string {
  if (!value) return "—"
  const date = new Date(value as string)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}
