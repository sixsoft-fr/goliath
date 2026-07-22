import type { AuthSession } from "./types"

// SEAM de restauration de session au démarrage, via le cookie refresh httpOnly.
// Tant que POST /auth/refresh n'est pas confirmé, renvoie null (= non connecté).
//
// Activation future (remplacer le corps par) :
//   import { api } from "@/lib/api"
//   return await api.post("auth/refresh").json<AuthSession>().catch(() => null)
export async function attemptSilentRefresh(): Promise<AuthSession | null> {
  return null
}
