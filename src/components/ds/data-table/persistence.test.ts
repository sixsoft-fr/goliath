import { describe, expect, it } from "vitest"
import { reconcile } from "./persistence"

const columns = ["name", "email", "status", "created_at"]

describe("reconcile", () => {
  it("garde l'ordre stocké et append les colonnes neuves en fin", () => {
    const out = reconcile({ columnOrder: ["status", "name"] }, columns)
    expect(out.columnOrder).toEqual(["status", "name", "email", "created_at"])
  })

  it("drop les ids disparus de l'ordre", () => {
    const out = reconcile({ columnOrder: ["ghost", "email", "name"] }, columns)
    expect(out.columnOrder).toEqual(["email", "name", "status", "created_at"])
  })

  it("ordre par défaut = colonnes actuelles quand rien de stocké", () => {
    expect(reconcile({}, columns).columnOrder).toEqual(columns)
  })

  it("drop la visibilité des colonnes disparues", () => {
    const out = reconcile(
      { columnVisibility: { email: false, ghost: false } },
      columns
    )
    expect(out.columnVisibility).toEqual({ email: false })
  })

  it("drop les filtres dont la colonne a disparu", () => {
    const out = reconcile(
      {
        columnFilters: [
          { id: "status", value: ["active"] },
          { id: "ghost", value: "x" },
        ],
      },
      columns
    )
    expect(out.columnFilters).toEqual([{ id: "status", value: ["active"] }])
  })

  it("drop les tris dont la colonne a disparu", () => {
    const out = reconcile(
      {
        sorting: [
          { id: "ghost", desc: true },
          { id: "name", desc: false },
        ],
      },
      columns
    )
    expect(out.sorting).toEqual([{ id: "name", desc: false }])
  })

  it("préserve pageSize quand présent", () => {
    expect(reconcile({ pageSize: 25 }, columns).pageSize).toBe(25)
    expect(reconcile({}, columns).pageSize).toBeUndefined()
  })
})
