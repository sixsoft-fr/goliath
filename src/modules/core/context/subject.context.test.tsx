// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { renderHook, act } from "@testing-library/react"
import type { ReactNode } from "react"
import type { Model } from "@/modules/core/model.types"
import {
  inferIdentifierType,
  SubjectProvider,
  useSubject,
} from "./subject.context"

describe("inferIdentifierType", () => {
  it("maps number to id", () => {
    expect(inferIdentifierType(42)).toBe("id")
  })

  it("maps UUID string to uuid", () => {
    expect(inferIdentifierType("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "uuid"
    )
  })

  it("maps other strings to slug", () => {
    expect(inferIdentifierType("acme-corp")).toBe("slug")
  })
})

function wrapper({ children }: { children: ReactNode }) {
  return <SubjectProvider>{children}</SubjectProvider>
}

const sampleModel: Model = {
  id: 1,
  uuid: "550e8400-e29b-41d4-a716-446655440000",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  deletedAt: null,
  morph_name: "user",
}

describe("useSubject", () => {
  it("throws outside SubjectProvider", () => {
    expect(() => renderHook(() => useSubject())).toThrow(
      "useSubject must be used within <SubjectProvider>"
    )
  })

  it("chains setResource → setIdentifier and infers identifierType", () => {
    const { result } = renderHook(() => useSubject(), { wrapper })

    act(() => {
      result.current
        .setResource("users")
        .setIdentifier("550e8400-e29b-41d4-a716-446655440000")
    })

    expect(result.current.resource).toBe("users")
    expect(result.current.identifier).toBe(
      "550e8400-e29b-41d4-a716-446655440000"
    )
    expect(result.current.identifierType).toBe("uuid")
  })

  it("infers id for numeric identifier", () => {
    const { result } = renderHook(() => useSubject(), { wrapper })

    act(() => {
      result.current.setResource("users").setIdentifier(7)
    })

    expect(result.current.identifier).toBe(7)
    expect(result.current.identifierType).toBe("id")
  })

  it("sets model via setModel", () => {
    const { result } = renderHook(() => useSubject(), { wrapper })

    act(() => {
      result.current.setModel(sampleModel)
    })

    expect(result.current.model).toEqual(sampleModel)
  })

  it("clear resets all fields", () => {
    const { result } = renderHook(() => useSubject(), { wrapper })

    act(() => {
      result.current.setResource("users").setIdentifier(1).setModel(sampleModel)
    })
    act(() => {
      result.current.clear()
    })

    expect(result.current.resource).toBeUndefined()
    expect(result.current.identifier).toBeUndefined()
    expect(result.current.identifierType).toBeUndefined()
    expect(result.current.model).toBeUndefined()
  })
})
