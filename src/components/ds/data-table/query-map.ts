import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
} from "@tanstack/react-table"
import type { TableQueries } from "@/modules/core/service/api.types"

// Clés serveur d'une colonne, indexées par son id TanStack.
export type ColumnServerKeys = { sortKey?: string; filterKey?: string }
export type KeyLookup = Record<string, ColumnServerKeys>

/** Id TanStack d'une colonne : `id` explicite, sinon `accessorKey`. */
export function columnId<T>(col: ColumnDef<T>): string {
  if (col.id) return col.id
  const accessor = (col as { accessorKey?: string }).accessorKey
  return accessor ?? ""
}

/** Extrait la table id → { sortKey, filterKey } depuis meta. */
export function columnKeys<T>(columns: ColumnDef<T>[]): KeyLookup {
  const lookup: KeyLookup = {}
  for (const col of columns) {
    const id = columnId(col)
    if (!id) continue
    lookup[id] = {
      sortKey: col.meta?.sortKey,
      filterKey: col.meta?.filter?.key,
    }
  }
  return lookup
}

/**
 * SortingState TanStack → paramètre spatie `s`. Mono-UI mais multi-capable :
 * plusieurs tris sont joints par virgule. `-` = desc. `undefined` si vide
 * (adaptFilters applique alors le défaut `-updated_at`).
 */
export function buildSort(sorting: SortingState, keys: KeyLookup): string | undefined {
  if (!sorting.length) return undefined
  return sorting
    .map((s) => `${s.desc ? "-" : ""}${keys[s.id]?.sortKey ?? s.id}`)
    .join(",")
}

/**
 * ColumnFiltersState TanStack → objet `filters` (clés serveur). Seules les
 * colonnes déclarant un `filterKey` sont retenues → aucune clé non-whitelistée.
 */
export function buildFilters(
  columnFilters: ColumnFiltersState,
  keys: KeyLookup,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const { id, value } of columnFilters) {
    const filterKey = keys[id]?.filterKey
    if (!filterKey) continue
    out[filterKey] = value
  }
  return out
}

export type QueryState = {
  sorting: SortingState
  columnFilters: ColumnFiltersState
  globalFilter: string
  pagination: PaginationState
}

/** État TanStack complet → TableQueries prêt pour `adaptFilters`. */
export function buildQueries(state: QueryState, keys: KeyLookup): TableQueries {
  return {
    query: state.globalFilter || undefined,
    page: state.pagination.pageIndex + 1,
    per_page: state.pagination.pageSize,
    sort: buildSort(state.sorting, keys),
    filters: buildFilters(state.columnFilters, keys),
  }
}
