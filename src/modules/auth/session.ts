import { api } from "@/lib/api"
import { getAccessToken, setAccessToken } from "./token-store"
import type { AuthSession, User } from "./types"

// Restauration de session au démarrage à partir du token persisté (localStorage).
// On le valide via GET /auth/me ; s'il est absent ou expiré (401), null =
// non connecté. Le refresh via cookie n'est pas tenté ici : inopérant en
// cross-site HTTP (cf. token-store.ts).
export async function attemptSilentRefresh(): Promise<AuthSession | null> {
  const accessToken = getAccessToken()
  if (!accessToken) return null

  try {
    const { user } = await api.get("auth/me").json<{ user: User }>()
    return { user, accessToken }
  } catch {
    setAccessToken(null)
    return null
  }
}
