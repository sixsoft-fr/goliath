import { describe, expect, it } from "vitest"
import { buildFilters, buildQueries, buildSort, columnId } from "./query-map"
import type { KeyLookup } from "./query-map"

const keys: KeyLookup = {
  name: { sortKey: "name", filterKey: "name" },
  email: { sortKey: "email", filterKey: "email" },
  status: { filterKey: "status" }, // filtrable non triable
  created_at: { sortKey: "created_at", filterKey: "created_at" },
  actions: {}, // ni tri ni filtre
}

describe("columnId", () => {
  it("préfère id explicite, sinon accessorKey", () => {
    expect(columnId({ id: "x", accessorKey: "y" } as never)).toBe("x")
    expect(columnId({ accessorKey: "y" } as never)).toBe("y")
  })
})

describe("buildSort", () => {
  it("mappe un tri asc via sortKey", () => {
    expect(buildSort([{ id: "name", desc: false }], keys)).toBe("name")
  })

  it("préfixe `-` en desc", () => {
    expect(buildSort([{ id: "created_at", desc: true }], keys)).toBe(
      "-created_at"
    )
  })

  it("joint plusieurs tris par virgule (multi-capable)", () => {
    expect(
      buildSort(
        [
          { id: "name", desc: false },
          { id: "created_at", desc: true },
        ],
        keys
      )
    ).toBe("name,-created_at")
  })

  it("retourne undefined sans tri (défaut délégué à adaptFilters)", () => {
    expect(buildSort([], keys)).toBeUndefined()
  })
})

describe("buildFilters", () => {
  it("ne retient que les colonnes avec filterKey", () => {
    expect(
      buildFilters(
        [
          { id: "name", value: "jean" },
          { id: "actions", value: "ignored" },
        ],
        keys
      )
    ).toEqual({ name: "jean" })
  })

  it("conserve les valeurs multi (tableau) et range (objet)", () => {
    expect(
      buildFilters(
        [
          { id: "status", value: ["active", "pending"] },
          { id: "created_at", value: { gte: "2026-01-01" } },
        ],
        keys
      )
    ).toEqual({
      status: ["active", "pending"],
      created_at: { gte: "2026-01-01" },
    })
  })
})

describe("buildQueries", () => {
  it("assemble TableQueries depuis l'état complet", () => {
    expect(
      buildQueries(
        {
          sorting: [{ id: "name", desc: false }],
          columnFilters: [{ id: "status", value: ["active"] }],
          globalFilter: "acme",
          pagination: { pageIndex: 2, pageSize: 25 },
        },
        keys
      )
    ).toEqual({
      query: "acme",
      page: 3, // pageIndex + 1
      per_page: 25,
      sort: "name",
      filters: { status: ["active"] },
    })
  })

  it("omet query quand vide", () => {
    expect(
      buildQueries(
        {
          sorting: [],
          columnFilters: [],
          globalFilter: "",
          pagination: { pageIndex: 0, pageSize: 10 },
        },
        keys
      )
    ).toEqual({
      query: undefined,
      page: 1,
      per_page: 10,
      sort: undefined,
      filters: {},
    })
  })
})
