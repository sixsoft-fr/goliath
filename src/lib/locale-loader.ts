// Pure path-matching for the i18n backend, kept side-effect free so it can be
// unit-tested without booting i18next.
//
// import.meta.glob("../modules/*/locales/*.json") yields keys like
// "../modules/auth/locales/fr.json". Given a namespace ("auth") and language
// ("fr") we find the matching key.
export function matchLocaleKey(
  keys: string[],
  ns: string,
  lng: string,
): string | undefined {
  const suffix = `/modules/${ns}/locales/${lng}.json`
  return keys.find((path) => path.endsWith(suffix))
}
