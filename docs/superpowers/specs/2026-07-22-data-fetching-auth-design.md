# Design — Couche data-fetching (ky + react-query) & auth JWT

**Date:** 2026-07-22
**Statut:** approuvé, prêt pour plan d'implémentation

## Contexte

SPA **Vite 8 / React 19 / react-router 8** (app "Goliath", modules WMS/PIM/sales/users…).
Aucune couche de data-fetching à ce jour : `src/modules/data/` est vide, pas de `fetch`,
pas de react-query, l'auth n'est qu'une coquille UI (`LoginForm` sans logique).
Backend existant, base URL via `VITE_API_URL`.

## Choix validés

| Sujet | Décision |
|---|---|
| Auth | Bearer JWT |
| Stockage access token | En mémoire (React context) |
| Refresh token | Cookie httpOnly posé par le serveur |
| Endpoint `/auth/refresh` | Incertain → **seam d'extension** (logout par défaut) |
| Retry | Piloté par react-query (`ky retry: 0`) |
| Périmètre | Infra + login câblé |
| Runner de test | Vitest (hypothèse — pas encore dans le repo) |

## Décision d'architecture : pont token ↔ ky

L'access token vit en mémoire dans un React context (pour la réactivité de `isAuthenticated`).
ky étant un module non-React, il ne peut pas lire un context.

**Retenu :** un module `token-store.ts` (`let accessToken` + `get/set`). Le context React
appelle `set`, le hook `beforeRequest` de ky appelle `get`. ky reste découplé de React et
testable isolément.

**Rejeté :** passer le token à chaque appel — verbeux, annule l'intérêt des hooks ky.

## Composants

### `src/modules/data/`
- **`api.ts`** — instance `ky.create()` :
  - `prefixUrl: import.meta.env.VITE_API_URL`
  - `credentials: "include"` (envoie le cookie refresh)
  - `retry: 0`
  - `hooks.beforeRequest` — injecte `Authorization: Bearer <getAccessToken()>` si token présent
  - `hooks.afterResponse` — sur `401`, appelle `handleUnauthorized()` (voir Flux 401)
  - `hooks.beforeError` — mappe le body `{ message }` de l'API vers `error.message`
- **`query.tsx`** — `QueryClient` (`retry: 2`, `staleTime` raisonnable) + `<QueryProvider>`.
- **`index.ts`** — exports publics (`api`, `QueryProvider`).

### `src/modules/auth/`
- **`token-store.ts`** — `getAccessToken()` / `setAccessToken(token | null)` en mémoire.
- **`auth.context.tsx`** — `<AuthProvider>` : état `user` / `isAuthenticated`, expose
  `login(user, token)` / `logout()`, synchronise le token vers `token-store`.
- **`hooks/use-login.ts`** — `useMutation` → `POST /auth/login` → `login()` + redirect `/app`.
- **`hooks/use-session.ts`** — bootstrap démarrage : tente un refresh silencieux. **Seam :**
  stub renvoyant « non connecté » par défaut ; activable en une fonction quand `/auth/refresh`
  est confirmé.
- **`require-auth.tsx`** — garde de route : `isAuthenticated` sinon `<Navigate to="/login" />`.

## Flux 401 (seam d'extension)

`afterResponse` sur `401` appelle **un seul point** `handleUnauthorized()` :
- **Défaut (aujourd'hui)** : `setAccessToken(null)` + redirect `/login`.
- **Quand `/auth/refresh` sera confirmé** : cette fonction tentera le refresh (via cookie),
  remplacera le token et rejouera la requête une fois. Un seul endroit à modifier.

## Câblage

- `main.tsx` : envelopper `<App>` dans `<QueryProvider>` puis `<AuthProvider>`
  (à l'intérieur de `<BrowserRouter>`, pour que `use-session`/redirects aient le routeur).
- `LoginForm.tsx` : brancher sur `use-login` (états loading/error, `onSubmit`).
- `App.tsx` : routes `app/*` derrière `<RequireAuth>`.

## Gestion d'erreur

- ky lève `HTTPError` sur 4xx/5xx ; `beforeError` enrichit le message depuis le body.
- react-query expose `error` / `isError` aux composants ; le `LoginForm` affiche l'erreur.

## Test (garde-fou, non exhaustif)

Un test Vitest sur la logique non-triviale du client `api.ts`, avec `fetch` mocké :
1. header `Authorization: Bearer <token>` injecté quand un token est présent ;
2. une réponse `401` déclenche `handleUnauthorized`.

## Hors périmètre (YAGNI)

- Interceptors/retry custom au-delà du défaut react-query.
- Refresh token effectif (tant que l'endpoint n'est pas confirmé — le seam est prêt).
- Login GitHub/OAuth (le bouton reste décoratif pour l'instant).
- Persistance du token au reload autre que via le refresh cookie.
