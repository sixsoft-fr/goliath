import { describe, expect, it } from "vitest"
import { adaptFilters, adaptSort, toQueryString } from "./list.utils"

describe("toQueryString", () => {
  it("assemble les paires key=value avec &", () => {
    expect(
      toQueryString({
        "f[topNode]": 1,
        "f[account]": 3,
        s: "-updated_at",
        page: 1,
        per_page: 10,
      }),
    ).toBe("f[topNode]=1&f[account]=3&s=-updated_at&page=1&per_page=10")
  })

  it("omet les valeurs undefined", () => {
    expect(
      toQueryString({
        a: 1,
        b: undefined,
        c: "ok",
      }),
    ).toBe("a=1&c=ok")
  })

  it("sérialise string, number et boolean", () => {
    expect(
      toQueryString({
        name: "acme",
        count: 2,
        active: true,
        archived: false,
      }),
    ).toBe("name=acme&count=2&active=true&archived=false")
  })

  it("renvoie une chaîne vide sans params", () => {
    expect(toQueryString({})).toBe("")
  })
})

describe("adaptFilters", () => {
  it("sérialise les filtres en f[key]=value", () => {
    expect(
      adaptFilters({
        filters: { topNode: 1, account: 3 },
      }),
    ).toBe("f[topNode]=1&f[account]=3&s=-updated_at&page=1&per_page=10")
  })

  it("applique les defaults sans filtres ni options", () => {
    expect(adaptFilters({})).toBe("s=-updated_at&page=1&per_page=10")
  })

  it("omet query quand elle est vide ou absente", () => {
    expect(adaptFilters({ query: "" })).toBe("s=-updated_at&page=1&per_page=10")
    expect(adaptFilters({})).not.toContain("query=")
  })

  it("conserve query, page, per_page et sort", () => {
    expect(
      adaptFilters({
        query: "acme",
        page: 2,
        per_page: 25,
        sort: "name",
        filters: { status: "active" },
      }),
    ).toBe("f[status]=active&s=name&query=acme&page=2&per_page=25")
  })

  it("applique un sort custom", () => {
    expect(adaptFilters({ sort: "name,-updated_at" })).toBe(
      "s=name,-updated_at&page=1&per_page=10",
    )
  })

  it("ignore les filtres null ou undefined", () => {
    expect(
      adaptFilters({
        filters: {
          topNode: 1,
          account: null,
          status: undefined,
        },
      }),
    ).toBe("f[topNode]=1&s=-updated_at&page=1&per_page=10")
  })

  it("stringifie les valeurs de filtre non primitives", () => {
    expect(
      adaptFilters({
        filters: { tags: ["a", "b"] },
      }),
    ).toBe("f[tags]=a,b&s=-updated_at&page=1&per_page=10")
  })
})

describe("adaptSort", () => {
  it("joint plusieurs tris par virgule", () => {
    expect(adaptSort(["name", "-updated_at"])).toBe("name,-updated_at")
  })

  it("renvoie le tri seul", () => {
    expect(adaptSort(["id"])).toBe("id")
  })

  it("renvoie une chaîne vide pour un tableau vide", () => {
    expect(adaptSort([])).toBe("")
  })
})
