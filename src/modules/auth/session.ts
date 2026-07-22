import { api, refreshAccessToken } from "@/lib/api"
import { setAccessToken } from "./token-store"
import type { AuthSession, User } from "./types"

// Restauration de session au démarrage, via le cookie refresh httpOnly.
// POST /auth/refresh ne renvoie que { accessToken } ; on récupère l'utilisateur
// courant via GET /auth (authentifié par le Bearer fraîchement rafraîchi).
// Pas de cookie / refresh expiré / user introuvable → null (= non connecté).
export async function attemptSilentRefresh(): Promise<AuthSession | null> {
  const accessToken = await refreshAccessToken()
  if (!accessToken) return null

  try {
    const user = await api.get("auth").json<User>()
    return { user, accessToken }
  } catch {
    setAccessToken(null)
    return null
  }
}
