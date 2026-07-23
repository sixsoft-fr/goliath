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

  it("restaure la session : refresh puis GET /auth/me pour l'utilisateur", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const path = new URL((input as Request).url).pathname
      if (path === "/auth/refresh") return Promise.resolve(json({ accessToken: "t" }))
      if (path === "/auth/me")
        return Promise.resolve(json({ user: { id: "1", email: "a@b.c" } }))
      return Promise.resolve(new Response(null, { status: 404 }))
    })

    const session = await attemptSilentRefresh()

    expect(session).toEqual({
      user: { id: "1", email: "a@b.c" },
      accessToken: "t",
    })
    expect(getAccessToken()).toBe("t")
  })

  it("renvoie null si le refresh échoue (pas de cookie / expiré)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 401 })
    )

    const session = await attemptSilentRefresh()

    expect(session).toBeNull()
    expect(getAccessToken()).toBeNull()
  })

  it("renvoie null si GET /auth/me échoue, sans relancer de refresh", async () => {
    const seen: Record<string, number> = {}
    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const path = new URL((input as Request).url).pathname
      seen[path] = (seen[path] ?? 0) + 1
      if (path === "/auth/refresh") return Promise.resolve(json({ accessToken: "t" }))
      if (path === "/auth/me") return Promise.resolve(new Response(null, { status: 401 }))
      return Promise.resolve(new Response(null, { status: 404 }))
    })

    const session = await attemptSilentRefresh()

    expect(session).toBeNull()
    expect(getAccessToken()).toBeNull()
    // GET /auth/me est exempt du flux 401 → pas de second refresh déclenché
    expect(seen["/auth/refresh"]).toBe(1)
  })
})
