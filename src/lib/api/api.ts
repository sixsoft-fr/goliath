import ky, { isHTTPError } from "ky"
import { getAccessToken, setAccessToken } from "@/modules/auth/token-store"
import { appConfig } from "@/config/app.config"

// Pont vers l'état React : ky est hors-React et ne peut pas appeler logout()
// directement. AuthProvider enregistre son logout au montage, pour que
// handleUnauthorized vide aussi `user` (pas seulement le token) et évite une
// incohérence transitoire (isAuthenticated resté true avant le reload).
let onUnauthorized: () => void = () => {}

export function setUnauthorizedHandler(fn: () => void): void {
  onUnauthorized = fn
}

// SEAM du flux 401. Aujourd'hui : purge le token + état React + redirect /login.
// Quand POST /auth/refresh sera confirmé : tenter le refresh (via cookie),
// setAccessToken(nouveau token), puis rejouer la requête. Seul endroit à changer.
export function handleUnauthorized(): void {
  setAccessToken(null)
  onUnauthorized()
  if (typeof window !== "undefined") {
    window.location.href = "/login"
  }
}

// Endpoints exempts du flux 401 (refresh + replay + redirect) :
// - auth/login, auth/refresh : un 401 y est une erreur métier (identifiants
//   invalides, refresh expiré), pas une expiration de session.
// - auth/me (GET = utilisateur courant) : sonde de session appelée au
//   bootstrap ; son 401 doit remonter tel quel pour que attemptSilentRefresh
//   échoue en silence, sans relancer un refresh ni rediriger.
const AUTH_PATHS = ["/auth/me", "/auth/login", "/auth/refresh"]

function isAuthEndpoint(url: string): boolean {
  const { pathname } = new URL(url)
  return AUTH_PATHS.some((path) => pathname.endsWith(path))
}

// Refresh single-flight : des 401 concurrents (ou le bootstrap) ne déclenchent
// qu'un seul POST /auth/refresh. Le refresh s'appuie sur le cookie httpOnly
// (credentials: "include"), ne renvoie que { accessToken }, et met à jour le
// token en mémoire. Échec → token purgé, renvoie null.
let refreshInFlight: Promise<string | null> | null = null

export function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= api
    .post("auth/refresh")
    .json<{ accessToken: string }>()
    .then(({ accessToken }) => {
      setAccessToken(accessToken)
      return accessToken
    })
    .catch(() => {
      setAccessToken(null)
      return null
    })
    .finally(() => {
      refreshInFlight = null
    })
  return refreshInFlight
}

export const api = ky.create({
  prefix: appConfig.api.baseUrl,
  credentials: "include",
  retry: 0,
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const token = getAccessToken()
        if (token) request.headers.set("Authorization", `Bearer ${token}`)
      },
    ],
    afterResponse: [
      async ({ request, response }) => {
        if (response.status !== 401 || isAuthEndpoint(request.url)) return

        const token = await refreshAccessToken()
        if (!token) {
          handleUnauthorized()
          return
        }

        request.headers.set("Authorization", `Bearer ${token}`)
        // ponytail: replay via fetch nu — pas de hooks, donc pas de ré-entrée
        // dans l'instance api (qui reboucle sur refresh). Pour une mutation dont
        // le body a déjà été streamé, fetch(request) lève (Request consommé) : on
        // retombe alors sur la réponse 401 d'origine pour surfacer une HTTPError
        // propre plutôt qu'un TypeError opaque. Les 401 d'expiration viennent
        // surtout des GET (react-query). Upgrade : retry ky natif si besoin.
        try {
          return await fetch(request)
        } catch {
          return response
        }
      },
    ],
    beforeError: [
      ({ error }) => {
        if (!isHTTPError(error)) return error
        const body = error.data
        if (
          body &&
          typeof body === "object" &&
          "message" in body &&
          typeof body.message === "string"
        ) {
          error.message = body.message
        }
        return error
      },
    ],
  },
})
