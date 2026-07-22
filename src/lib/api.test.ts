import { beforeEach, describe, expect, it, vi } from "vitest"
import { isHTTPError } from "ky"
import { api, setUnauthorizedHandler } from "./api"
import { getAccessToken, setAccessToken } from "@/modules/auth/token-store"

describe("api client", () => {
  beforeEach(() => {
    setAccessToken(null)
    setUnauthorizedHandler(() => {})
    vi.restoreAllMocks()
  })

  it("injecte le header Authorization quand un token est présent", async () => {
    setAccessToken("abc123")
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      )

    await api.get("http://api.test/ping").json()

    const request = fetchMock.mock.calls[0][0] as Request
    expect(request.headers.get("Authorization")).toBe("Bearer abc123")
  })

  it("purge le token sur une réponse 401", async () => {
    setAccessToken("abc123")
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 401 })
    )

    await expect(api.get("http://api.test/secret").json()).rejects.toThrow()

    expect(getAccessToken()).toBeNull()
  })

  it("mappe le message d'erreur depuis le corps JSON d'une réponse en erreur", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Invalid credentials" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    )

    let caught: unknown
    try {
      await api.get("http://api.test/login").json()
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(Error)
    expect((caught as Error).message).toBe("Invalid credentials")
    expect(isHTTPError(caught)).toBe(true)
    if (isHTTPError(caught)) {
      expect(caught.response.status).toBe(400)
    }
  })

  it("ne déclenche pas le handler de session expirée sur un 401 de /auth/login", async () => {
    setAccessToken("abc123")
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 401 })
    )

    await expect(
      api.post("http://api.test/auth/login", { json: {} }).json()
    ).rejects.toThrow()

    expect(getAccessToken()).toBe("abc123")
  })

  it("notifie le handler de session expirée sur un 401 non-auth, pas sur un 401 auth", async () => {
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 401 })
    )

    await expect(api.get("http://api.test/secret").json()).rejects.toThrow()
    expect(onUnauthorized).toHaveBeenCalledTimes(1)

    await expect(
      api.post("http://api.test/auth/login", { json: {} }).json()
    ).rejects.toThrow()
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })
})
