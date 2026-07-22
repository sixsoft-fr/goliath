import ky, { isHTTPError } from "ky"
import { getAccessToken, setAccessToken } from "@/modules/auth/token-store"

// SEAM du flux 401. Aujourd'hui : purge le token + redirect /login.
// Quand POST /auth/refresh sera confirmé : tenter le refresh (via cookie),
// setAccessToken(nouveau token), puis rejouer la requête. Seul endroit à changer.
export function handleUnauthorized(): void {
  setAccessToken(null)
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
