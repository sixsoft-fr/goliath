// Access token en mémoire. Lu par le hook beforeRequest de ky (module non-React),
// écrit par l'AuthProvider. Volontairement pas de persistance : au reload, la
// session est restaurée via le cookie refresh (voir session.ts).
let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}
