# Subject Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le brouillon `subject.context.tsx` par un contexte React typé (pattern Auth) avec setters fluides et `identifierType` déduit, couvert par vitest.

**Architecture:** Un provider `useState` expose état + setters fluides via `createContext(null)`. Helper pur `inferIdentifierType` exporté depuis le même module. Aucun couplage à `FlexService` — les consommateurs lisent `resource` / `identifier` et appellent `useFlex` eux-mêmes.

**Tech Stack:** React 19 (`use`, `createContext`), TypeScript (`as const`, pas d’enum), Vitest + `@testing-library/react` (jsdom), pattern aligné sur `src/modules/auth/auth.context.tsx`.

**Spec:** `docs/superpowers/specs/2026-07-31-subject-context-design.md`

---

## File map

| Fichier | Rôle |
|---|---|
| `src/modules/core/context/subject.context.tsx` | Types, `inferIdentifierType`, Provider, `useSubject` |
| `src/modules/core/context/subject.context.test.tsx` | Tests unitaires (jsdom) |
| `src/modules/core/index.ts` | Re-export public |
| `src/modules/core/context/AGENTS.md` | DOX local (contrat Subject) |
| `AGENTS.md` (root) | Indexer le child DOX |

---

### Task 0: Baseline vert

**Files:** none

- [ ] **Step 1: Run unit tests**

```bash
npx vitest run
```

Expected: PASS (baseline vert). Si rouge → **stop**, fixer ou reporter avant toute feature.

- [ ] **Step 2: Run e2e**

```bash
npx playwright test
```

Expected: PASS. Si rouge → **stop**, fixer ou reporter.

---

### Task 1: `inferIdentifierType` (TDD)

**Files:**
- Create/Overwrite: `src/modules/core/context/subject.context.tsx`
- Create: `src/modules/core/context/subject.context.test.tsx`

- [ ] **Step 1: Write the failing tests for `inferIdentifierType`**

Create `src/modules/core/context/subject.context.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/modules/core/context/subject.context.test.tsx
```

Expected: FAIL — `inferIdentifierType` not exported / not defined.

- [ ] **Step 3: Implement `inferIdentifierType` (+ minimal stubs so the module loads)**

Replace `src/modules/core/context/subject.context.tsx` with:

```tsx
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
```

Note: full Provider is included here so later tasks don’t rewrite the file — Task 1’s acceptance is only `inferIdentifierType` tests green; Provider tests come next.

- [ ] **Step 4: Run inferIdentifierType tests**

```bash
npx vitest run src/modules/core/context/subject.context.test.tsx
```

Expected: PASS for the three `inferIdentifierType` cases.

- [ ] **Step 5: Commit**

```bash
git add src/modules/core/context/subject.context.tsx src/modules/core/context/subject.context.test.tsx
git commit -m "$(cat <<'EOF'
feat(core): add inferIdentifierType for subject context

EOF
)"
```

---

### Task 2: Provider + `useSubject` (TDD)

**Files:**
- Modify: `src/modules/core/context/subject.context.test.tsx`
- Verify: `src/modules/core/context/subject.context.tsx` (already implemented in Task 1)

- [ ] **Step 1: Write failing Provider / hook tests**

Append to `src/modules/core/context/subject.context.test.tsx`:

```tsx
import { render, renderHook, act } from "@testing-library/react"
import type { ReactNode } from "react"
import type { Model } from "@/modules/core/model.types"
import {
  SubjectProvider,
  useSubject,
} from "./subject.context"

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
      "useSubject must be used within <SubjectProvider>",
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
      "550e8400-e29b-41d4-a716-446655440000",
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
      result.current
        .setResource("users")
        .setIdentifier(1)
        .setModel(sampleModel)
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
```

Keep imports consolidated at the top of the file (no inline imports). Remove unused `render` if not needed — prefer only `renderHook` / `act`.

- [ ] **Step 2: Run tests**

```bash
npx vitest run src/modules/core/context/subject.context.test.tsx
```

Expected: PASS (implementation already in Task 1). If any fail, fix `SubjectProvider` / `useSubject` until green — do not weaken assertions.

- [ ] **Step 3: Commit**

```bash
git add src/modules/core/context/subject.context.tsx src/modules/core/context/subject.context.test.tsx
git commit -m "$(cat <<'EOF'
feat(core): finish SubjectProvider with fluent setters

EOF
)"
```

---

### Task 3: Barrel export

**Files:**
- Modify: `src/modules/core/index.ts`

- [ ] **Step 1: Re-export context from core**

Update `src/modules/core/index.ts` to:

```ts
export * from "./model.types"
export * from "./service"
export * from "./context/subject.context"
```

- [ ] **Step 2: Typecheck smoke**

```bash
npx tsc --noEmit
```

Expected: PASS (no new errors from the export).

- [ ] **Step 3: Commit**

```bash
git add src/modules/core/index.ts
git commit -m "$(cat <<'EOF'
feat(core): export subject context from module barrel

EOF
)"
```

---

### Task 4: DOX

**Files:**
- Create: `src/modules/core/context/AGENTS.md`
- Modify: `AGENTS.md` (Child DOX Index)

- [ ] **Step 1: Write local AGENTS.md**

Create `src/modules/core/context/AGENTS.md`:

```md
# AGENTS.md — core/context

## Purpose

Contexte React de la ressource « courante » (show/edit) : `resource`,
`identifier`, `identifierType`, `model`. Bridge pour les consumers flex
(`useFlex(resource, identifier)`) — pas de `FlexService` ici.

## Ownership

- Possède : `subject.context.tsx`, tests associés.
- Consomme : `@/modules/core/model.types`.

## Local Contracts

- Pattern Auth : `createContext(null)`, `useSubject()` throw hors provider.
- Setters fluides : `setResource` / `setIdentifier` / `setModel` retournent
  l’objet fluent ; `clear()` reset.
- `identifierType` déduit via `inferIdentifierType` (`number` → `"id"`,
  UUID → `"uuid"`, sinon `"slug"`). Pas d’override manuel MVP.
- Types : `as const` + type dérivé, pas d’enum TS.

## Work Guidance

- Ne pas coupler ce contexte à `FlexService` / `Service` singleton.
- Nouveaux champs sujet : étendre `SubjectState` + setter fluent + tests.

## Verification

- `npx vitest run src/modules/core/context/subject.context.test.tsx`

## Child DOX Index

Aucun enfant.
```

- [ ] **Step 2: Index in root AGENTS.md**

Under `## Child DOX Index`, add:

```md
- `src/modules/core/context/AGENTS.md` — Subject context (ressource courante show/edit).
```

Keep the existing DataTable / users entries.

- [ ] **Step 3: Commit**

```bash
git add src/modules/core/context/AGENTS.md AGENTS.md
git commit -m "$(cat <<'EOF'
docs(dox): document subject context contracts

EOF
)"
```

---

### Task 5: Vérification finale

**Files:** none

- [ ] **Step 1: Run full vitest**

```bash
npx vitest run
```

Expected: PASS, including subject context suite.

- [ ] **Step 2: Run e2e**

```bash
npx playwright test
```

Expected: PASS (no e2e impact expected; baseline rule still applies).

- [ ] **Step 3: Done checklist**

- [ ] Spec requirements covered (fluent setters, infer, throw, clear, export, tests, DOX)
- [ ] No `FlexService` import in `subject.context.tsx`
- [ ] No helpers invented inside the test file beyond RTL wrappers

---

## Hors périmètre (ne pas faire)

- Wiring pages users / show-edit
- Props initiales sur `SubjectProvider`
- Override manuel de `identifierType`
- Modifications `useFlex` / `FlexService`

## Self-review (plan vs spec)

| Spec requirement | Task |
|---|---|
| `createContext(null)` + throw | Task 1 impl + Task 2 tests |
| État resource/identifier/identifierType/model | Task 1 |
| Setters fluides + clear | Task 1 + Task 2 |
| `inferIdentifierType` rules | Task 1 |
| Pas de FlexService | File map + Task 5 checklist |
| Export `@/modules/core` | Task 3 |
| Vitest coverage | Task 1–2 |
| DOX child AGENTS | Task 4 |
| Baseline vert avant feature | Task 0 |
