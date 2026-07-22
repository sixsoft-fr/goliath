# Couche data-fetching (ky + react-query) & auth JWT — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poser une couche de requêtes HTTP (ky) + état serveur (react-query) et câbler un flux de login JWT sur l'API existante.

**Architecture:** ky (`src/lib/api.ts`) porte le transport — injection du Bearer token, gestion du 401, mapping d'erreur — via ses hooks. Le token vit en mémoire dans un `token-store` module-level que ky lit sans dépendre de React ; un `AuthProvider` React tient l'état réactif (`user`/`isAuthenticated`). react-query (`src/lib/query.tsx`) pilote cache et retry. Le flux 401 passe par un seul point d'extension `handleUnauthorized()`.

**Tech Stack:** Vite 8, React 19, react-router 8, ky, @tanstack/react-query, Vitest.

## Global Constraints

- Access token **en mémoire uniquement** (jamais localStorage) — refresh token via cookie httpOnly.
- ky : `credentials: "include"`, `retry: 0` (react-query pilote le retry).
- Infra HTTP/query dans `src/lib/` — **ne pas** utiliser `src/modules/data/` (réservé).
- Alias d'import `@/*` → `./src/*` (déjà configuré).
- React 19 : utiliser `use(Context)` et `<Context value=…>` (sans `.Provider`).
- Refresh endpoint non confirmé → `handleUnauthorized()` et `attemptSilentRefresh()` sont des **seams** : comportement par défaut sûr, un seul endroit à modifier plus tard.

---

### Task 1: Dépendances, typage env, config Vitest

**Files:**
- Modify: `package.json` (deps + scripts)
- Create: `src/vite-env.d.ts`
- Modify: `vite.config.ts`

**Interfaces:**
- Produces: `import.meta.env.VITE_API_URL: string` typé ; commande `npm run test` fonctionnelle.

- [ ] **Step 1: Installer les dépendances**

```bash
npm install ky @tanstack/react-query
npm install -D vitest
```

- [ ] **Step 2: Typer la variable d'environnement**

Create `src/vite-env.d.ts` :

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

- [ ] **Step 3: Ajouter la config Vitest à vite.config.ts**

Replace `vite.config.ts` avec :

```ts
/// <reference types="vitest/config" />
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
  },
})
```

- [ ] **Step 4: Ajouter le script de test dans package.json**

Dans `"scripts"`, ajouter :

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Vérifier que le runner démarre**

Run: `npm run test`
Expected: sortie Vitest « No test files found » (exit 0) — le runner est opérationnel.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/vite-env.d.ts vite.config.ts
git commit -m "chore: add ky, react-query, vitest + env typing"
```

---

### Task 2: Token-store en mémoire

**Files:**
- Create: `src/modules/auth/token-store.ts`

**Interfaces:**
- Produces: `getAccessToken(): string | null`, `setAccessToken(token: string | null): void`

- [ ] **Step 1: Écrire le token-store**

Create `src/modules/auth/token-store.ts` :

```ts
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
```

> ponytail : get/set d'une variable = trivial, pas de test dédié. Il est exercé par le test de `api.ts` (Task 3).

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/modules/auth/token-store.ts
git commit -m "feat(auth): in-memory access token store"
```

---

### Task 3: Client ky + flux 401 (cœur, TDD)

**Files:**
- Create: `src/lib/api.ts`
- Test: `src/lib/api.test.ts`

**Interfaces:**
- Consumes: `getAccessToken`, `setAccessToken` (Task 2)
- Produces: `api` (instance ky), `handleUnauthorized(): void`

- [ ] **Step 1: Écrire les tests qui échouent**

Create `src/lib/api.test.ts` :

```ts
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
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))

    await api.get("http://api.test/ping").json()

    const request = fetchMock.mock.calls[0][0] as Request
    expect(request.headers.get("Authorization")).toBe("Bearer abc123")
  })

  it("purge le token sur une réponse 401", async () => {
    setAccessToken("abc123")
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 401 }))

    await expect(api.get("http://api.test/secret").json()).rejects.toThrow()

    expect(getAccessToken()).toBeNull()
  })
})
```

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

Run: `npm run test`
Expected: FAIL — `Cannot find module './api'`.

- [ ] **Step 3: Écrire le client ky**

Create `src/lib/api.ts` :

```ts
import ky from "ky"
import { getAccessToken, setAccessToken } from "@/modules/auth/token-store"

// SEAM du flux 401. Aujourd'hui : purge le token + redirect /login.
// Quand POST /auth/refresh sera confirmé : tenter le refresh (via cookie),
// setAccessToken(nouveau token), puis rejouer la requête. Seul endroit à changer.
export function handleUnauthorized(): void {
  setAccessToken(null)
  if (typeof window !== "undefined") {
    window.location.href = "/login"
  }
}

export const api = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL,
  credentials: "include",
  retry: 0,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getAccessToken()
        if (token) request.headers.set("Authorization", `Bearer ${token}`)
      },
    ],
    afterResponse: [
      (_request, _options, response) => {
        if (response.status === 401) handleUnauthorized()
      },
    ],
    beforeError: [
      async (error) => {
        const body = await error.response
          ?.clone()
          .json()
          .catch(() => null)
        if (body && typeof body.message === "string") {
          error.message = body.message
        }
        return error
      },
    ],
  },
})
```

- [ ] **Step 4: Lancer les tests pour vérifier le succès**

Run: `npm run test`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/api.ts src/lib/api.test.ts
git commit -m "feat(api): ky client with bearer injection and 401 handling"
```

---

### Task 4: QueryProvider

**Files:**
- Create: `src/lib/query.tsx`

**Interfaces:**
- Produces: `<QueryProvider>` (composant wrapper)

- [ ] **Step 1: Écrire le provider react-query**

Create `src/lib/query.tsx` :

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
})

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/lib/query.tsx
git commit -m "feat(query): react-query provider with default options"
```

---

### Task 5: Types auth + seam de bootstrap

**Files:**
- Create: `src/modules/auth/types.ts`
- Create: `src/modules/auth/session.ts`

**Interfaces:**
- Produces: types `User`, `AuthSession`, `LoginPayload` ; `attemptSilentRefresh(): Promise<AuthSession | null>`

- [ ] **Step 1: Écrire les types**

Create `src/modules/auth/types.ts` :

```ts
export type User = {
  id: string
  email: string
  name?: string
}

export type AuthSession = {
  user: User
  accessToken: string
}

export type LoginPayload = {
  email: string
  password: string
}
```

- [ ] **Step 2: Écrire le seam de bootstrap**

Create `src/modules/auth/session.ts` :

```ts
import type { AuthSession } from "./types"

// SEAM de restauration de session au démarrage, via le cookie refresh httpOnly.
// Tant que POST /auth/refresh n'est pas confirmé, renvoie null (= non connecté).
//
// Activation future (remplacer le corps par) :
//   import { api } from "@/lib/api"
//   return await api.post("auth/refresh").json<AuthSession>().catch(() => null)
export async function attemptSilentRefresh(): Promise<AuthSession | null> {
  return null
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b`
Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add src/modules/auth/types.ts src/modules/auth/session.ts
git commit -m "feat(auth): session types and silent-refresh seam"
```

---

### Task 6: AuthProvider + useAuth

**Files:**
- Create: `src/modules/auth/auth.context.tsx`

**Interfaces:**
- Consumes: `setAccessToken` (Task 2), `attemptSilentRefresh` (Task 5), types `User`/`AuthSession` (Task 5)
- Produces: `<AuthProvider>`, `useAuth(): { user, isAuthenticated, isBootstrapping, login, logout }`

- [ ] **Step 1: Écrire le contexte auth**

Create `src/modules/auth/auth.context.tsx` :

```tsx
import { createContext, use, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { setAccessToken } from "./token-store"
import { attemptSilentRefresh } from "./session"
import type { AuthSession, User } from "./types"

type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (session: AuthSession) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  function login(session: AuthSession) {
    setAccessToken(session.accessToken)
    setUser(session.user)
  }

  function logout() {
    setAccessToken(null)
    setUser(null)
  }

  useEffect(() => {
    let cancelled = false
    attemptSilentRefresh().then((session) => {
      if (cancelled) return
      if (session) login(session)
      setIsBootstrapping(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AuthContext
      value={{ user, isAuthenticated: user !== null, isBootstrapping, login, logout }}
    >
      {children}
    </AuthContext>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>")
  return ctx
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/modules/auth/auth.context.tsx
git commit -m "feat(auth): AuthProvider with in-memory session + bootstrap"
```

---

### Task 7: Hook useLogin

**Files:**
- Create: `src/modules/auth/hooks/use-login.ts`

**Interfaces:**
- Consumes: `api` (Task 3), `useAuth` (Task 6), types `AuthSession`/`LoginPayload` (Task 5)
- Produces: `useLogin()` — mutation react-query (`mutate`, `isPending`, `isError`, `error`)

- [ ] **Step 1: Écrire le hook de login**

Create `src/modules/auth/hooks/use-login.ts` :

```ts
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { api } from "@/lib/api"
import { useAuth } from "../auth.context"
import type { AuthSession, LoginPayload } from "../types"

export function useLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      api.post("auth/login", { json: payload }).json<AuthSession>(),
    onSuccess: (session) => {
      login(session)
      navigate("/app")
    },
  })
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/modules/auth/hooks/use-login.ts
git commit -m "feat(auth): useLogin mutation"
```

---

### Task 8: Garde de route RequireAuth

**Files:**
- Create: `src/modules/auth/require-auth.tsx`

**Interfaces:**
- Consumes: `useAuth` (Task 6)
- Produces: `<RequireAuth>` — rend `children` si authentifié, sinon redirige `/login`

- [ ] **Step 1: Écrire la garde**

Create `src/modules/auth/require-auth.tsx` :

```tsx
import { Navigate } from "react-router"
import type { ReactNode } from "react"
import { useAuth } from "./auth.context"

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isBootstrapping } = useAuth()

  // Attendre la fin du bootstrap avant de décider — évite un flash /login.
  if (isBootstrapping) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <>{children}</>
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/modules/auth/require-auth.tsx
git commit -m "feat(auth): RequireAuth route guard"
```

---

### Task 9: Câbler le LoginForm sur useLogin

**Files:**
- Modify: `src/modules/auth/components/LoginForm.tsx`

**Interfaces:**
- Consumes: `useLogin` (Task 7)

- [ ] **Step 1: Brancher le formulaire**

Dans `src/modules/auth/components/LoginForm.tsx` :

1. Ajouter l'import en tête de fichier :

```tsx
import { useLogin } from "@/modules/auth/hooks/use-login"
```

2. Au début du corps de `LoginForm`, avant le `return`, ajouter le handler :

```tsx
  const login = useLogin()

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    login.mutate({
      email: String(data.get("email")),
      password: String(data.get("password")),
    })
  }
```

3. Ajouter `onSubmit` sur le `<form>` :

```tsx
    <form onSubmit={onSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
```

4. Ajouter `name="email"` à l'input email :

```tsx
          <Input id="email" name="email" type="email" placeholder="m@example.com" required />
```

5. Ajouter `name="password"` à l'input password :

```tsx
          <Input id="password" name="password" type="password" required />
```

6. Remplacer le bouton `<Button type="submit">Login</Button>` par un bouton avec état + message d'erreur :

```tsx
        <Field>
          {login.isError && (
            <FieldDescription className="text-center text-destructive">
              {login.error.message}
            </FieldDescription>
          )}
          <Button type="submit" disabled={login.isPending}>
            {login.isPending ? "Signing in…" : "Login"}
          </Button>
        </Field>
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/modules/auth/components/LoginForm.tsx
git commit -m "feat(auth): wire LoginForm to useLogin"
```

---

### Task 10: Câbler les providers et protéger les routes

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `<QueryProvider>` (Task 4), `<AuthProvider>` (Task 6), `<RequireAuth>` (Task 8)

- [ ] **Step 1: Envelopper l'app dans les providers**

Replace `src/main.tsx` avec :

```tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { TooltipProvider } from "@/components/ui/tooltip"
import { BrowserRouter } from "react-router"
import { QueryProvider } from "@/lib/query"
import { AuthProvider } from "@/modules/auth/auth.context"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryProvider>
        <AuthProvider>
          <ThemeProvider>
            <TooltipProvider>
              <App />
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryProvider>
    </BrowserRouter>
  </StrictMode>
)
```

- [ ] **Step 2: Protéger les routes `app/*`**

Dans `src/App.tsx` :

1. Ajouter l'import :

```tsx
import { RequireAuth } from "@/modules/auth/require-auth"
```

2. Envelopper l'élément de la route `app` :

```tsx
      <Route path="app" element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Home />} />
      </Route>
```

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc -b && npm run build`
Expected: build réussi, aucune erreur de type.

- [ ] **Step 4: Lancer la suite de tests complète**

Run: `npm run test`
Expected: PASS (les 2 tests de `api.test.ts`).

- [ ] **Step 5: Commit**

```bash
git add src/main.tsx src/App.tsx
git commit -m "feat: wire query/auth providers and protect app routes"
```

---

## Self-Review

**Spec coverage :**
- ky client + 3 hooks → Task 3 ✅
- QueryProvider → Task 4 ✅
- token-store → Task 2 ✅
- auth.context (user/isAuthenticated, login/logout, sync token) → Task 6 ✅
- use-login → Task 7 ✅
- use-session / bootstrap refresh seam → Task 5 (`session.ts`) + Task 6 (bootstrap dans le provider) ✅
- require-auth → Task 8 ✅
- Flux 401 seam (`handleUnauthorized`) → Task 3 ✅
- Câblage main.tsx + LoginForm + routes → Tasks 9, 10 ✅
- beforeError mapping → Task 3 ✅
- Test garde-fou (header + 401) → Task 3 ✅
- Vitest ajouté → Task 1 ✅

**Placeholders :** aucun — tout le code est fourni, pas de TODO restant hormis les 2 seams volontaires (documentés inline).

**Cohérence des types :** `getAccessToken`/`setAccessToken`, `AuthSession`, `LoginPayload`, `useAuth`, `useLogin`, `handleUnauthorized`, `attemptSilentRefresh`, `QueryProvider`, `AuthProvider`, `RequireAuth` — noms identiques entre définition et consommation. ✅

**Hors périmètre (rappel) :** refresh effectif, login GitHub/OAuth, persistance localStorage — seams prêts, non implémentés (YAGNI).
