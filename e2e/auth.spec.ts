import { test, expect } from "@playwright/test"

// Flux d'authentification bout-en-bout. Encode les critères de succès :
//  - login correct → /app
//  - refresh sur /app → toujours /app, utilisateur défini, access token non-null
//
// Prérequis : dev server (`npm run dev`) + API accessibles. Surchargeable via env :
//   E2E_BASE_URL (défaut http://localhost:5173), E2E_EMAIL, E2E_PASSWORD.
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173"
const EMAIL = process.env.E2E_EMAIL ?? "test@example.com"
const PASSWORD = process.env.E2E_PASSWORD ?? "secret-password"

async function login(page: import("@playwright/test").Page) {
  await page.goto(`${BASE_URL}/login`)
  // Partir d'un état non authentifié déterministe.
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await page.getByLabel("Email").fill(EMAIL)
  await page.getByLabel("Password").fill(PASSWORD)
  await page.getByRole("button", { name: "Login" }).click()
}

test.describe("Authentification", () => {
  test("un login correct redirige vers /app", async ({ page }) => {
    await login(page)

    await expect(page).toHaveURL(/\/app\/?$/)
    await expect(page.getByText(EMAIL)).toBeVisible()
  })

  test("le refresh conserve la session (/app, user défini, token non-null)", async ({
    page,
  }) => {
    await login(page)
    await expect(page).toHaveURL(/\/app\/?$/)

    // Le vrai test : rechargement complet de la page.
    await page.reload()

    await expect(page).toHaveURL(/\/app\/?$/)
    await expect(page.getByText(EMAIL)).toBeVisible()

    const token = await page.evaluate(() => localStorage.getItem("accessToken"))
    expect(token).not.toBeNull()
  })
})
