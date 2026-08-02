// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { inferIdentifierType } from "./subject.context"

describe("inferIdentifierType", () => {
  it("maps number to id", () => {
    expect(inferIdentifierType(42)).toBe("id")
  })

  it("maps UUID string to uuid", () => {
    expect(inferIdentifierType("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "uuid",
    )
  })

  it("maps other strings to slug", () => {
    expect(inferIdentifierType("acme-corp")).toBe("slug")
  })
})
