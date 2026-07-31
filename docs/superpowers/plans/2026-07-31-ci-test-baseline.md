# CI test baseline — vitest + e2e vraiment verts en CI

**Date:** 2026-07-31
**Statut:** ✅ réalisé (branche `ci/test-baseline`) — D1=(a) mock réseau, D2=(a), D3=(a).
Vérifié : e2e 4/4 hermétique (API injoignable `mock.invalid`) ET 4/4 local (vrai backend) ;
vitest 36/36 ; `tsc -b` clean. Reste manuel : activer la protection de branche (jobs requis).
**Contexte:** Suite à la standardisation bun (commit `6fabb4b`), le workflow `playwright.yml` installe désormais via bun. Mais deux trous restent :
1. **vitest ne tourne pas en CI** (aucun job) — alors que les Règles absolues d'AGENTS.md exigent un baseline vert.
2. **Les e2e ne peuvent pas s'exécuter en CI** : `playwright.config.ts` n'a pas de `webServer`, et les specs (`auth`, `notifications`) tapent le backend réel `laravel-api.test`, absent de GitHub Actions.

---

## Décisions à trancher AVANT d'exécuter (bloquantes)

| # | Décision | Options | Reco |
|---|---|---|---|
| D1 | Backend pour les e2e en CI | (a) **Mock réseau** via `page.route()` sur `**/api/**` ; (b) monter le vrai Laravel (service container + DB + migrations + seed, cross-repo) ; (c) exclure les e2e backend-dépendants du CI | **(a)** — CI hermétique, déterministe, zéro dépendance cross-repo |
| D2 | Comportement local des e2e | (a) local = vrai backend par défaut, mock seulement en CI (via env `E2E_MOCK=1`) ; (b) mock partout | **(a)** — garde une vraie intégration en local, un CI hermétique |
| D3 | Structure workflow | (a) un seul `ci.yml` avec jobs `unit` + `e2e` ; (b) deux workflows séparés | **(a)** — une vue, deux jobs parallèles |

> Si D1 = (b), ce plan change radicalement (provisionner l'API) — à rediscuter. Le plan ci-dessous suppose **D1=(a), D2=(a), D3=(a)**.

---

## Phase 1 — Job vitest en CI (quick win, aucun backend)

- [ ] Renommer/étendre `.github/workflows/playwright.yml` → `ci.yml` avec deux jobs.
- [ ] Job `unit` : `oven-sh/setup-bun` → `bun install --frozen-lockfile` → `bunx vitest run`.
- [ ] Vérifier en local : `bunx vitest run` (déjà vert, 36/36).
- **Acceptation :** un push/PR fait tourner vitest ; un test rouge fait échouer le job.

## Phase 2 — Rendre les e2e exécutables (hermétique)

- [ ] `playwright.config.ts` : ajouter `webServer` pour démarrer l'app
  (`command: "bun run dev"`, `url: "http://localhost:5173"`, `reuseExistingServer: !process.env.CI`).
- [ ] Créer une fixture Playwright (`e2e/fixtures/mock-api.ts`) qui intercepte l'hôte de `VITE_API_URL`
  et renvoie des fixtures pour les endpoints utilisés par les specs :
  - `POST /auth` → `{ token, user }`
  - `GET /auth` → `{ user, is_super_admin, authority }`
  - `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/mark-all-read`
  - (garder les fixtures alignées sur les contrats réels — cf. `docs/.../specs/2026-07-22-data-fetching-auth-design.md`)
- [ ] Activer le mock quand `E2E_MOCK=1` (mis dans l'env du job CI) ; sinon les specs tapent le vrai backend (local).
- [ ] Adapter `auth.spec.ts` et `notifications.spec.ts` pour consommer la fixture.
- [ ] Neutraliser le WebSocket Reverb en e2e (l'app ouvre un socket vers `laravel-api.test:8080`) :
  soit stub via `page.route`/`addInitScript`, soit garde déjà en place (le socket échoue en silence ?
  à vérifier — ne doit pas faire échouer les specs).
- **Acceptation :** `E2E_MOCK=1 bunx playwright test` passe sans backend externe, en local ET en CI.

## Phase 3 — Câblage CI + garde-fous

- [ ] Job `e2e` dans `ci.yml` : setup-bun → install → `bunx playwright install --with-deps` →
  `E2E_MOCK=1 bunx playwright test` → upload `playwright-report/`.
- [ ] Les deux jobs (`unit`, `e2e`) doivent être requis pour merger.
      ⟶ **Note :** la protection de branche est un réglage GitHub (Settings → Branches),
      pas du code — à activer manuellement, je ne peux pas le faire ici.
- [ ] Facultatif : ajouter un step typecheck (`bunx tsc -b`) au job `unit` (aujourd'hui vert).
- **Acceptation :** un PR ouvre les 2 jobs ; baseline rouge = merge bloqué (une fois la protection activée).

---

## Hors périmètre (YAGNI)

- Monter le vrai backend Laravel en CI (sauf si D1=(b)).
- Matrice multi-navigateurs (chromium suffit pour le baseline ; firefox/webkit plus tard si besoin).
- Tests visuels / de régression d'image.

## Risques / points de vigilance

- **Dérive des mocks** : les fixtures e2e doivent suivre les contrats API réels, sinon faux vert.
  Mitigation : fixtures minimales, dérivées des specs, + garder les e2e locaux non-mockés comme
  vérité d'intégration.
- **Flakiness du webServer** : prévoir un `timeout` généreux et `reuseExistingServer` en local.
- **Socket Reverb** : à museler proprement pour éviter des erreurs console qui pourraient masquer
  de vrais problèmes.
