import { beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "./api"
import { getAccessToken, setAccessToken } from "@/modules/auth/token-store"

describe("api client", () => {
  beforeEach(() => {
    setAccessToken(null)
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
})
