/* eslint-disable react-refresh/only-export-components */
import { createContext, use, useState, type ReactNode } from "react"
import type { Model } from "@/modules/core/model.types"

export const IDENTIFIER_TYPES = ["uuid", "id", "slug"] as const
export type IdentifierType = (typeof IDENTIFIER_TYPES)[number]

export type SubjectState = {
  resource: string | undefined
  identifier: string | number | undefined
  identifierType: IdentifierType | undefined
  model: Model | undefined
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function inferIdentifierType(
  value: string | number,
): IdentifierType {
  if (typeof value === "number") return "id"
  if (UUID_RE.test(value)) return "uuid"
  return "slug"
}

type SubjectFluent = {
  setResource: (resource: string) => SubjectFluent
  setIdentifier: (identifier: string | number) => SubjectFluent
  setModel: (model: Model) => SubjectFluent
}

export type SubjectContextValue = SubjectState &
  SubjectFluent & {
    clear: () => void
  }

const SubjectContext = createContext<SubjectContextValue | null>(null)

const initialState: SubjectState = {
  resource: undefined,
  identifier: undefined,
  identifierType: undefined,
  model: undefined,
}

export function SubjectProvider({ children }: { children: ReactNode }) {
  const [subject, setSubject] = useState<SubjectState>(initialState)

  const fluent: SubjectFluent = {
    setResource(resource) {
      setSubject((prev) => ({ ...prev, resource }))
      return fluent
    },
    setIdentifier(identifier) {
      setSubject((prev) => ({
        ...prev,
        identifier,
        identifierType: inferIdentifierType(identifier),
      }))
      return fluent
    },
    setModel(model) {
      setSubject((prev) => ({ ...prev, model }))
      return fluent
    },
  }

  function clear() {
    setSubject(initialState)
  }

  return (
    <SubjectContext
      value={{
        ...subject,
        ...fluent,
        clear,
      }}
    >
      {children}
    </SubjectContext>
  )
}

export function useSubject(): SubjectContextValue {
  const ctx = use(SubjectContext)
  if (!ctx) {
    throw new Error("useSubject must be used within <SubjectProvider>")
  }
  return ctx
}
