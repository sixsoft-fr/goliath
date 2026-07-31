import { test as base, expect } from "@playwright/test"

// Backend hermétique pour le CI. Quand E2E_MOCK=1, on intercepte les appels API
// (auth + notifications) et le WebSocket Reverb, pour que les e2e tournent sans
// le backend réel `laravel-api.test`. Sans E2E_MOCK (local), la fixture est
// inerte → les specs tapent le vrai backend (vérité d'intégration).
const MOCK = !!process.env.E2E_MOCK
const EMAIL = process.env.E2E_EMAIL ?? "test@example.com"

// Aligné sur le contrat réel : GET /auth → { user, ... }, POST /auth → { token, user }.
// email = EMAIL pour que NavUser l'affiche (assertions des specs).
const mockUser = {
  id: "1",
  name: "Test User",
  email: EMAIL,
  emailVerifiedAt: null,
  locale: "fr",
  avatar: null,
  slug: "test-user",
  account_id: 1,
}

export const test = base.extend({
  page: async ({ page }, use) => {
    if (MOCK) {
      // GET /api/auth = utilisateur courant ; POST /api/auth = login.
      await page.route(/\/api\/auth(\?|$)/, (route) =>
        route.request().method() === "POST"
          ? route.fulfill({ json: { token: "e2e-mock-token", user: mockUser } })
          : route.fulfill({
              json: { user: mockUser, is_super_admin: false, authority: [] },
            }),
      )
      // Défauts notifications (une spec peut surcharger : sa route, enregistrée
      // après, a la priorité). unread-count enregistré avant la route générale.
      await page.route(/\/api\/notifications\/unread-count/, (route) =>
        route.fulfill({ json: { count: 0 } }),
      )
      await page.route(/\/api\/notifications(\?|$)/, (route) =>
        route.fulfill({ json: { data: [] } }),
      )
      // Auth de canal privé Reverb (hors /api, à la racine Laravel).
      await page.route(/\/broadcasting\/auth/, (route) =>
        route.fulfill({ json: { auth: "" } }),
      )
      // WebSocket Reverb (laravel-api.test:8080) : absorbé, pas de serveur en CI.
      await page.routeWebSocket(/:8080\//, () => {})
    }
    await use(page)
  },
})

export { expect }
