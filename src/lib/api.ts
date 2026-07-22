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
      ({ response }) => {
        if (response.status === 401) handleUnauthorized()
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
