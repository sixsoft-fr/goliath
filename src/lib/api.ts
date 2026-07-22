import ky, { isHTTPError } from "ky"
import { getAccessToken, setAccessToken } from "@/modules/auth/token-store"

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

// Les 401 des endpoints d'auth eux-mêmes (identifiants invalides, refresh
// expiré) ne sont pas des expirations de session : ils ne doivent pas
// déclencher handleUnauthorized, sous peine d'écraser l'erreur métier
// (ex. "Invalid credentials") par une purge + redirect.
const AUTH_PATHS = ["auth/login", "auth/refresh"]

function isAuthEndpoint(url: string): boolean {
  return AUTH_PATHS.some((path) => new URL(url).pathname.endsWith(path))
}

export const api = ky.create({
  prefix: import.meta.env.VITE_API_URL,
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
      ({ request, response }) => {
        if (response.status === 401 && !isAuthEndpoint(request.url)) {
          handleUnauthorized()
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
