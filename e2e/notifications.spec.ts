import { test, expect } from "@playwright/test"

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

test("cliquer sur Notifications affiche le message sans crash React", async ({
  page,
}) => {
  // Forme exacte du bug : `data` est un objet, pas une string JSON.
  await page.route("**/notifications/unread-count", (route) =>
    route.fulfill({ json: { data: 1 } }),
  )
  await page.route("**/notifications**", (route, request) => {
    // Ne pas intercepter les sous-routes (mark-read, unread-count déjà routé).
    if (request.method() !== "GET") return route.continue()
    return route.fulfill({
      json: {
        data: [
          {
            id: "n1",
            type: "test",
            notifiable_type: "user",
            notifiable_id: "1",
            data: { title: "Titre", message: "Vous avez un nouveau message" },
            read_at: null,
            created_at: 0,
            updated_at: 0,
          },
        ],
      },
    })
  })

  // Échoue le test à la moindre erreur JS non catchée (le crash React en était une).
  const pageErrors: string[] = []
  page.on("pageerror", (err) => pageErrors.push(err.message))

  // Login (même flux que auth.spec.ts).
  await page.goto(`${BASE_URL}/login`)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByLabel("Email").fill(EMAIL)
  await page.getByLabel("Password").fill(PASSWORD)
  await page.getByRole("button", { name: "Login" }).click()
  await expect(page).toHaveURL(/\/app\/?$/)

  // Ouvre le dropdown Notifications depuis la sidebar.
  await page.getByRole("button", { name: "Notifications" }).click()

  // Le message est rendu, pas l'objet brut, et l'app n'a pas crashé.
  await expect(page.getByText("Vous avez un nouveau message")).toBeVisible()
  await expect(page.getByText("[object Object]")).toHaveCount(0)
  expect(pageErrors).toEqual([])
})
