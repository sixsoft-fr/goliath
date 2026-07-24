// Access token lu par le hook beforeRequest de ky (module non-React), écrit par
// l'AuthProvider. Persisté en localStorage pour survivre au refresh de page :
// le refresh via cookie de session ne fonctionne pas en cross-site HTTP
// (localhost ↔ laravel-api.test, cookie SameSite=Lax non renvoyé).
// ponytail: contrepartie = token exposé au XSS. Upgrade propre = corriger le
// cookie côté API (SameSite=None + HTTPS, ou même domaine) et revenir en
// mémoire seule + refresh cookie.
const STORAGE_KEY = "accessToken"

let accessToken: string | null =
  typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null

// Incrémenté à chaque écriture. Permet à un refresh en vol de détecter qu'un
// logout/login est survenu depuis son démarrage et de ne pas ré-appliquer un
// token périmé (sinon Bearer valide alors que isAuthenticated = false).
let generation = 0

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
  generation++
  if (typeof localStorage === "undefined") return
  if (token) localStorage.setItem(STORAGE_KEY, token)
  else localStorage.removeItem(STORAGE_KEY)
}

export function getTokenGeneration(): number {
  return generation
}
