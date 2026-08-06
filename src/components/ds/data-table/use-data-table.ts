import { useEffect, useMemo, useState } from "react"
import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  SortingState,
  Updater,
  VisibilityState,
} from "@tanstack/react-table"
import { columnId, columnKeys, buildQueries } from "./query-map"
import { loadView, saveView } from "./persistence"

export type UseDataTableOptions<T> = {
  /** Clé de persistance localStorage (datatable:v1:{tableId}). */
  tableId: string
  /** Namespace i18n de la ressource (ex: "users") pour fields/values. */
  namespace: string
  columns: ColumnDef<T>[]
}

function resolve<S>(updater: Updater<S>, prev: S): S {
  return typeof updater === "function"
    ? (updater as (p: S) => S)(prev)
    : updater
}

/**
 * Hook headless server-driven. Possède l'état de vue (tri/filtres/ordre/
 * visibilité/pagination/recherche) + la persistance localStorage, et dérive le
 * `TableQueries`. NE fait PAS le fetch et NE construit PAS la table (c'est
 * `<DataTable>` qui la monte avec les `data`) → aucune dépendance circulaire.
 *
 * Usage : `const dt = useDataTable(...); const q = useUsers(dt.queries);`
 * puis `<DataTable instance={dt} data={q.data?.data ?? []} meta={q.data?.meta} />`.
 */
export function useDataTable<T>({
  tableId,
  namespace,
  columns,
}: UseDataTableOptions<T>) {
  const columnIds = useMemo(
    () => columns.map(columnId).filter(Boolean),
    [columns]
  )
  const keys = useMemo(() => columnKeys(columns), [columns])

  // Chargé + réconcilié une fois au montage (SPA, localStorage dispo).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initial = useMemo(() => loadView(tableId, columnIds), [tableId])

  const [sorting, setSorting] = useState<SortingState>(initial.sorting ?? [])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    initial.columnFilters ?? []
  )
  const [globalFilter, setGlobalFilter] = useState("") // non persisté
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initial.columnVisibility ?? {}
  )
  const [columnOrder, setColumnOrder] = useState<string[]>(
    initial.columnOrder ?? columnIds
  )
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initial.pageSize ?? 10,
  })

  // Tout changement de query (tri/filtre/recherche) ramène à la page 1.
  const resetPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }))

  const onSortingChange: OnChangeFn<SortingState> = (u) => {
    setSorting((prev) => resolve(u, prev))
    resetPage()
  }
  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (u) => {
    setColumnFilters((prev) => resolve(u, prev))
    resetPage()
  }
  const onGlobalFilterChange: OnChangeFn<string> = (u) => {
    setGlobalFilter((prev) => resolve(u, prev))
    resetPage()
  }

  // Persiste la vue (hors globalFilter/pageIndex volontairement).
  useEffect(() => {
    saveView(tableId, {
      columnOrder,
      columnVisibility,
      pageSize: pagination.pageSize,
      columnFilters,
      sorting,
    })
  }, [
    tableId,
    columnOrder,
    columnVisibility,
    pagination.pageSize,
    columnFilters,
    sorting,
  ])

  const queries = useMemo(
    () =>
      buildQueries({ sorting, columnFilters, globalFilter, pagination }, keys),
    [sorting, columnFilters, globalFilter, pagination, keys]
  )

  return {
    tableId,
    namespace,
    columns,
    // état (contrôlé par `<DataTable>`)
    sorting,
    columnFilters,
    globalFilter,
    columnVisibility,
    columnOrder,
    pagination,
    // handlers
    onSortingChange,
    onColumnFiltersChange,
    onGlobalFilterChange,
    setColumnVisibility,
    setColumnOrder,
    setPagination,
    setGlobalFilter: onGlobalFilterChange,
    // dérivé
    queries,
  }
}

export type DataTableInstance<T> = ReturnType<typeof useDataTable<T>>
