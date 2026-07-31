import { useEffect, useMemo, useState } from "react"
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  type Updater,
  type VisibilityState,
} from "@tanstack/react-table"
import type { PaginatedResponse } from "@/modules/core/service/paginated.types"
import { columnId, columnKeys, buildQueries } from "./query-map"
import { loadView, saveView } from "./persistence"

type Meta = PaginatedResponse<unknown>["meta"] | undefined

export type UseDataTableOptions<T> = {
  /** Clé de persistance localStorage (datatable:v1:{tableId}). */
  tableId: string
  /** Namespace i18n de la ressource (ex: "users") pour fields/values. */
  namespace: string
  columns: ColumnDef<T>[]
  /** Lignes de la page courante (fournies par l'appelant via react-query). */
  data: T[]
  /** Meta de pagination Laravel (last_page/total). */
  meta?: Meta
}

function resolve<S>(updater: Updater<S>, prev: S): S {
  return typeof updater === "function" ? (updater as (p: S) => S)(prev) : updater
}

/**
 * Hook headless server-driven. Possède l'état de vue + la persistance
 * localStorage, expose l'instance TanStack et le TableQueries dérivé.
 * Le fetch reste à l'appelant : `const { table, queries } = useDataTable(...)`.
 */
export function useDataTable<T>({
  tableId,
  namespace,
  columns,
  data,
  meta,
}: UseDataTableOptions<T>) {
  const columnIds = useMemo(() => columns.map(columnId).filter(Boolean), [columns])
  const keys = useMemo(() => columnKeys(columns), [columns])

  // Chargé + réconcilié une fois au montage (SPA, localStorage dispo).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initial = useMemo(() => loadView(tableId, columnIds), [tableId])

  const [sorting, setSorting] = useState<SortingState>(initial.sorting ?? [])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    initial.columnFilters ?? [],
  )
  const [globalFilter, setGlobalFilter] = useState("") // non persisté
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initial.columnVisibility ?? {},
  )
  const [columnOrder, setColumnOrder] = useState<string[]>(
    initial.columnOrder ?? columnIds,
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
  }, [tableId, columnOrder, columnVisibility, pagination.pageSize, columnFilters, sorting])

  const table = useReactTable<T>({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter, columnVisibility, columnOrder, pagination },
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
    enableMultiSort: false, // mono-tri UI
    pageCount: meta?.last_page ?? -1,
    rowCount: meta?.total,
    onSortingChange,
    onColumnFiltersChange,
    onGlobalFilterChange,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
  })

  const queries = useMemo(
    () => buildQueries({ sorting, columnFilters, globalFilter, pagination }, keys),
    [sorting, columnFilters, globalFilter, pagination, keys],
  )

  return {
    table,
    queries,
    namespace,
    globalFilter,
    setGlobalFilter: onGlobalFilterChange,
    columnOrder,
    setColumnOrder,
  }
}

export type DataTableInstance<T> = ReturnType<typeof useDataTable<T>>
