import { beforeEach, describe, expect, it, vi } from "vitest"
import { attemptSilentRefresh } from "./session"
import { getAccessToken, setAccessToken } from "./token-store"

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("attemptSilentRefresh", () => {
  beforeEach(() => {
    setAccessToken(null)
    vi.restoreAllMocks()
  })

  it("restaure la session depuis le token persisté via GET /auth", async () => {
    setAccessToken("t")
    const seen: Record<string, number> = {}
    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const path = new URL((input as Request).url).pathname
      seen[path] = (seen[path] ?? 0) + 1
      if (path === "/auth")
        return Promise.resolve(json({ user: { id: "1", email: "a@b.c" } }))
      return Promise.resolve(new Response(null, { status: 404 }))
    })

    const session = await attemptSilentRefresh()

    expect(session).toEqual({
      user: { id: "1", email: "a@b.c" },
      accessToken: "t",
    })
    expect(getAccessToken()).toBe("t")
    // Pas de refresh cookie : inopérant en cross-site HTTP, on s'appuie sur le token.
    expect(seen["/auth/refresh"]).toBeUndefined()
  })

  it("renvoie null si aucun token persisté (jamais connecté)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")

    const session = await attemptSilentRefresh()

    expect(session).toBeNull()
    expect(getAccessToken()).toBeNull()
    // Pas de token → aucune requête réseau tentée.
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("renvoie null et purge le token si GET /auth échoue (token expiré)", async () => {
    setAccessToken("t")
    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const path = new URL((input as Request).url).pathname
      if (path === "/auth") return Promise.resolve(new Response(null, { status: 401 }))
      return Promise.resolve(new Response(null, { status: 404 }))
    })

    const session = await attemptSilentRefresh()

    expect(session).toBeNull()
    expect(getAccessToken()).toBeNull()
  })
})
