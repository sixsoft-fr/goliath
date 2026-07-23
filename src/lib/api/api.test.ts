import { beforeEach, describe, expect, it, vi } from "vitest"
import { isHTTPError } from "ky"
import { api, setUnauthorizedHandler } from "./api"
import { getAccessToken, setAccessToken } from "@/modules/auth/token-store"

// The ky client's prefix is set to http://api.test in the Vitest env
// (see vite.config.ts). Tests call relative paths — like production code —
// and route the mocked fetch by pathname.

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function mockFetch(handler: (req: Request) => Response) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockImplementation((input) => Promise.resolve(handler(input as Request)))
}

function pathOf(req: Request): string {
  return new URL(req.url).pathname
}

describe("api client", () => {
  beforeEach(() => {
    setAccessToken(null)
    setUnauthorizedHandler(() => {})
    vi.restoreAllMocks()
  })

  it("injecte le header Authorization quand un token est présent", async () => {
    setAccessToken("abc123")
    const fetchMock = mockFetch(() => json({ ok: true }))

    await api.get("ping").json()

    const request = fetchMock.mock.calls[0][0] as Request
    expect(request.headers.get("Authorization")).toBe("Bearer abc123")
  })

  it("mappe le message d'erreur depuis le corps JSON d'une réponse en erreur", async () => {
    mockFetch(() => json({ message: "Invalid credentials" }, 400))

    let caught: unknown
    try {
      await api.get("resource").json()
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(Error)
    expect((caught as Error).message).toBe("Invalid credentials")
    expect(isHTTPError(caught)).toBe(true)
  })

  it("purge le token mais ne tente ni refresh ni handler sur un 401 d'un endpoint d'auth", async () => {
    setAccessToken("abc123")
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)
    const fetchMock = mockFetch(() => new Response(null, { status: 401 }))

    await expect(api.post("auth", { json: {} }).json()).rejects.toThrow()

    expect(onUnauthorized).not.toHaveBeenCalled()
    // Le Bearer périmé est purgé pour ne pas être renvoyé à la requête suivante.
    expect(getAccessToken()).toBeNull()
    const refreshCalls = fetchMock.mock.calls.filter(
      ([req]) => pathOf(req as Request) === "/auth/refresh"
    )
    expect(refreshCalls).toHaveLength(0)
  })

  it("sur 401 non-auth, rafraîchit puis rejoue la requête avec le nouveau token", async () => {
    setAccessToken("stale")
    const secretCalls: Request[] = []
    mockFetch((req) => {
      const path = pathOf(req)
      if (path === "/auth/refresh") return json({ accessToken: "fresh" })
      if (path === "/secret") {
        secretCalls.push(req)
        return secretCalls.length === 1
          ? new Response(null, { status: 401 })
          : json({ data: "ok" })
      }
      return new Response(null, { status: 404 })
    })

    const result = await api.get("secret").json<{ data: string }>()

    expect(result.data).toBe("ok")
    expect(getAccessToken()).toBe("fresh")
    expect(secretCalls).toHaveLength(2)
    expect(secretCalls[1].headers.get("Authorization")).toBe("Bearer fresh")
  })

  it("sur 401 non-auth, si le refresh échoue, purge le token et notifie le handler", async () => {
    setAccessToken("stale")
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)
    mockFetch(() => new Response(null, { status: 401 }))

    await expect(api.get("secret").json()).rejects.toThrow()

    expect(getAccessToken()).toBeNull()
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it("des 401 concurrents ne déclenchent qu'un seul POST /auth/refresh", async () => {
    setAccessToken("stale")
    const seen: Record<string, number> = {}
    mockFetch((req) => {
      const path = pathOf(req)
      seen[path] = (seen[path] ?? 0) + 1
      if (path === "/auth/refresh") return json({ accessToken: "fresh" })
      return seen[path] === 1
        ? new Response(null, { status: 401 })
        : json({ ok: true })
    })

    await Promise.all([api.get("a").json(), api.get("b").json()])

    expect(seen["/auth/refresh"]).toBe(1)
  })

  it("sur 401 d'une mutation, si le replay est impossible, renvoie une HTTPError 401 (pas un TypeError)", async () => {
    setAccessToken("stale")
    const orderCalls: Request[] = []
    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const req = input as Request
      const path = pathOf(req)
      if (path === "/auth/refresh") return Promise.resolve(json({ accessToken: "fresh" }))
      if (path === "/orders") {
        orderCalls.push(req)
        return orderCalls.length === 1
          ? Promise.resolve(new Response(null, { status: 401 }))
          : // replay : simule un Request déjà consommé (body streamé)
            Promise.reject(new TypeError("Request already used"))
      }
      return Promise.resolve(new Response(null, { status: 404 }))
    })

    let caught: unknown
    try {
      await api.post("orders", { json: { qty: 1 } }).json()
    } catch (error) {
      caught = error
    }

    expect(isHTTPError(caught)).toBe(true)
    if (isHTTPError(caught)) expect(caught.response.status).toBe(401)
  })
})
