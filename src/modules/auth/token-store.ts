// Access token en mémoire. Lu par le hook beforeRequest de ky (module non-React),
// écrit par l'AuthProvider. Volontairement pas de persistance : au reload, la
// session est restaurée via le cookie refresh (voir session.ts).
let accessToken: string | null = null

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
}

export function getTokenGeneration(): number {
  return generation
}
