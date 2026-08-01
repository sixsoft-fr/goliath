import type {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"

// Bump pour invalider tout le stock quand le format change.
const STORAGE_VERSION = "v1"
const storageKey = (tableId: string) => `datatable:${STORAGE_VERSION}:${tableId}`

/**
 * Vue persistée en localStorage. NB : `globalFilter` (recherche) et
 * `pageIndex` (page courante) ne sont volontairement PAS persistés.
 */
export type PersistedView = {
  columnOrder: string[]
  columnVisibility: VisibilityState
  pageSize: number
  columnFilters: ColumnFiltersState
  sorting: SortingState
}

/**
 * Réconcilie une vue stockée avec les colonnes actuelles :
 * - ordre : ids connus dans l'ordre stocké, puis colonnes neuves en fin
 * - visibilité / filtres / tri : on drop les ids disparus
 * Garantit qu'une colonne retirée du code ne casse pas la restauration.
 */
export function reconcile(
  view: Partial<PersistedView>,
  columnIds: string[],
): Partial<PersistedView> {
  const known = new Set(columnIds)

  const storedOrder = (view.columnOrder ?? []).filter((id) => known.has(id))
  const appended = columnIds.filter((id) => !storedOrder.includes(id))
  const columnOrder = [...storedOrder, ...appended]

  const columnVisibility: VisibilityState = Object.fromEntries(
    Object.entries(view.columnVisibility ?? {}).filter(([id]) => known.has(id)),
  )

  const columnFilters = (view.columnFilters ?? []).filter((f) => known.has(f.id))
  const sorting = (view.sorting ?? []).filter((s) => known.has(s.id))

  return {
    columnOrder,
    columnVisibility,
    columnFilters,
    sorting,
    ...(view.pageSize !== undefined ? { pageSize: view.pageSize } : {}),
  }
}

/** Charge + réconcilie la vue. Tolère l'absence/corruption du storage. */
export function loadView(
  tableId: string,
  columnIds: string[],
): Partial<PersistedView> {
  try {
    const raw = localStorage.getItem(storageKey(tableId))
    if (!raw) return reconcile({}, columnIds)
    return reconcile(JSON.parse(raw) as Partial<PersistedView>, columnIds)
  } catch {
    return reconcile({}, columnIds)
  }
}

/** Sauvegarde la vue (best-effort, silencieux si localStorage indisponible). */
export function saveView(tableId: string, view: PersistedView): void {
  try {
    localStorage.setItem(storageKey(tableId), JSON.stringify(view))
  } catch {
    // quota / mode privé : on ignore, la persistance est un confort
  }
}
