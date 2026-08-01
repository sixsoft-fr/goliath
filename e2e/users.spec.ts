import { test, expect } from "./fixtures/mock-api"
import type { Page, Route } from "@playwright/test"

// DataTable étendu, câblé bout-en-bout sur /app/users. Mock hermétique de
// /api/users (E2E_MOCK=1 côté fixture pour auth). On prouve :
//  - rendu des lignes paginées
//  - la table envoie les bons paramètres spatie (query, s, page) — pas de 400
//  - reset page 1 sur recherche
//  - état vide
//  - aucun crash React
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173"
const EMAIL = process.env.E2E_EMAIL ?? "test@example.com"
const PASSWORD = process.env.E2E_PASSWORD ?? "secret-password"

const user = (id: number, name: string, email: string) => ({
  id,
  uuid: `u${id}`,
  name,
  email,
  status: "active",
  createdAt: "2026-01-15T10:00:00Z",
  updatedAt: "2026-01-15T10:00:00Z",
  deletedAt: null,
  morph_name: "user",
  locale: "fr",
  avatar: null,
  slug: `user-${id}`,
  account_id: 1,
  emailVerifiedAt: null,
})

const paginated = (rows: unknown[], total = rows.length, lastPage = 1) => ({
  data: rows,
  meta: {
    current_page: 1,
    from: rows.length ? 1 : 0,
    last_page: lastPage,
    path: "/api/users",
    per_page: 10,
    to: rows.length,
    total,
    links: [],
  },
  links: { first: null, last: null, next: null, prev: null },
})

const mockUsers = (page: Page, handler: (route: Route) => void) =>
  page.route(/\/api\/users(\?|$)/, handler)

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByLabel("Email").fill(EMAIL)
  await page.getByLabel("Password").fill(PASSWORD)
  await page.getByRole("button", { name: "Login" }).click()
  await expect(page).toHaveURL(/\/app\/?$/)
}

test("liste les utilisateurs et envoie les paramètres spatie (query + tri)", async ({
  page,
}) => {
  const urls: string[] = []
  await mockUsers(page, (route) => {
    urls.push(route.request().url())
    route.fulfill({
      json: paginated([
        user(1, "Alice Martin", "alice@example.io"),
        user(2, "Bob Durand", "bob@example.io"),
      ], 2),
    })
  })

  const pageErrors: string[] = []
  page.on("pageerror", (e) => pageErrors.push(e.message))

  await login(page)
  await page.goto(`${BASE_URL}/app/users`)

  // Lignes rendues (timeout large : 1er build du chunk lazy sous charge parallèle).
  await expect(page.getByText("Alice Martin")).toBeVisible({ timeout: 15000 })
  await expect(page.getByText("Bob Durand")).toBeVisible()

  // 1er appel : defaults spatie.
  expect(urls[0]).toContain("s=-updated_at")
  expect(urls[0]).toContain("per_page=10")

  // Recherche → query envoyée + reset page 1.
  const searchReq = page.waitForRequest(
    (r) => /\/api\/users/.test(r.url()) && r.url().includes("query=Alice"),
  )
  await page.getByTestId("datatable-search").fill("Alice")
  const req = await searchReq
  expect(req.url()).toMatch(/[?&]page=1(&|$)/)

  // Tri par name (asc) → s=name.
  const sortReq = page.waitForRequest(
    (r) => /\/api\/users/.test(r.url()) && /[?&]s=name(&|$)/.test(r.url()),
  )
  await page.getByTestId("datatable-sort-name").click()
  await sortReq

  // On détecte les vraies erreurs app (crash React…), en ignorant le flake
  // dev-server de Vite : le chunk lazy /app/users peut échouer à se charger
  // ("Importing a module script failed") quand plusieurs navigateurs le
  // compilent à froid en parallèle. Absent en CI (workers=1) et en prod (build).
  const appErrors = pageErrors.filter(
    (e) => !/Importing a module script failed/i.test(e),
  )
  expect(appErrors).toEqual([])
})

test("affiche l'état vide quand aucune ligne", async ({ page }) => {
  await mockUsers(page, (route) => route.fulfill({ json: paginated([], 0, 1) }))

  await login(page)
  await page.goto(`${BASE_URL}/app/users`)

  await expect(page.getByText(/Aucun résultat|No results/)).toBeVisible({
    timeout: 15000,
  })
})

test("la pagination suivante envoie page=2", async ({ page }) => {
  await mockUsers(page, (route) =>
    route.fulfill({
      json: paginated([user(1, "Alice Martin", "alice@example.io")], 25, 3),
    }),
  )

  await login(page)
  await page.goto(`${BASE_URL}/app/users`)
  await expect(page.getByText("Alice Martin")).toBeVisible({ timeout: 15000 })

  const nextReq = page.waitForRequest(
    (r) => /\/api\/users/.test(r.url()) && /[?&]page=2(&|$)/.test(r.url()),
  )
  await page.getByTestId("datatable-next").click()
  await nextReq
})
