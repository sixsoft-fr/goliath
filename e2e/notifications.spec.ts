import { test, expect } from "./fixtures/mock-api"

// Régression : cliquer sur Notifications dans la sidebar crashait (écran blanc)
// avec "Objects are not valid as a React child (found: object with keys
// {title, message})". Cause : l'API renvoie `data` déjà parsé en objet, alors
// que le composant supposait une string JSON.
//
// Ce test prouve le comportement de bout en bout en mockant l'API pour renvoyer
// exactement la forme qui déclenchait le bug (data = objet), puis vérifie que :
//  - aucune erreur JS non catchée n'est levée (pas de crash React)
//  - le dropdown s'ouvre et affiche le `message`, pas "[object Object]"
//
// Prérequis : dev server (`npm run dev`). Surchargeable via env (cf. auth.spec.ts).
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173"
const EMAIL = process.env.E2E_EMAIL ?? "test@example.com"
const PASSWORD = process.env.E2E_PASSWORD ?? "secret-password"

type Page = import("@playwright/test").Page

const notification = (data: unknown) => ({
  id: "n1",
  type: "test",
  notifiable_type: "user",
  notifiable_id: "1",
  data,
  read_at: null,
  created_at: 0,
  updated_at: 0,
})

// Mocks scopés au chemin API (…/api/notifications). Regex plutôt que glob
// pour ne PAS intercepter les modules source Vite (/src/modules/notifications/…).
async function mockNotifications(
  page: Page,
  { unread, items }: { unread: number; items: unknown[] },
) {
  await page.route(/\/api\/notifications\/unread-count/, (route) =>
    route.fulfill({ json: { count: unread } }),
  )
  await page.route(/\/api\/notifications(\?|$)/, (route) =>
    route.fulfill({ json: { data: items } }),
  )
}

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByLabel("Email").fill(EMAIL)
  await page.getByLabel("Password").fill(PASSWORD)
  await page.getByRole("button", { name: "Login" }).click()
  await expect(page).toHaveURL(/\/app\/?$/)
}

test("cliquer sur Notifications affiche le message sans crash React", async ({
  page,
}) => {
  // Forme exacte du bug : `data` est un objet, pas une string JSON.
  await mockNotifications(page, {
    unread: 1,
    items: [notification({ title: "Titre", message: "Vous avez un nouveau message" })],
  })

  // Échoue le test à la moindre erreur JS non catchée (le crash React en était une).
  const pageErrors: string[] = []
  page.on("pageerror", (err) => pageErrors.push(err.message))

  await login(page)

  // Ouvre le dropdown Notifications depuis la sidebar.
  await page.getByRole("button", { name: "Notifications" }).click()

  // Le message est rendu, pas l'objet brut, et l'app n'a pas crashé.
  await expect(page.getByText("Vous avez un nouveau message")).toBeVisible()
  await expect(page.getByText("[object Object]")).toHaveCount(0)
  expect(pageErrors).toEqual([])
})

test("le badge affiche le nombre, puis 9+ au-delà de 9", async ({ page }) => {
  const trigger = () => page.getByRole("button", { name: "Notifications" })

  // 3 non-lues → badge "3".
  await mockNotifications(page, { unread: 3, items: [notification("x")] })
  await login(page)
  await expect(trigger()).toContainText("3")

  // 12 non-lues → badge plafonné à "9+".
  await mockNotifications(page, { unread: 12, items: [notification("x")] })
  await page.reload()
  await expect(trigger()).toContainText("9+")

  // Le badge est sur l'icône, donc visible même sidebar repliée.
  await page.locator('[data-sidebar="trigger"]').click()
  await expect(trigger().getByText("9+")).toBeVisible()
})
