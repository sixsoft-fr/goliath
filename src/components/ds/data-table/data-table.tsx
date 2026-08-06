import { useTranslation } from "react-i18next"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type Header,
} from "@tanstack/react-table"
import type { PaginatedResponse } from "@/modules/core/service/paginated.types"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  DragDropVerticalIcon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTableToolbar } from "./data-table-toolbar"
import { DataTablePagination } from "./data-table-pagination"
import type { DataTableInstance } from "./use-data-table"

type Meta = PaginatedResponse<unknown>["meta"] | undefined

export type DataTableProps<T> = {
  instance: DataTableInstance<T>
  /** Lignes de la page courante (fournies par l'appelant via react-query). */
  data: T[]
  /** Meta de pagination Laravel (last_page / total). */
  meta?: Meta
  isLoading?: boolean
  isFetching?: boolean
  isError?: boolean
  /** Clic sur une ligne → reçoit la donnée (row.original). Rend la ligne interactive. */
  onRowClick?: (row: T) => void
}

// En-tête : poignée de drag (dnd-kit) + tri au clic (si sortKey) + libellé i18n.
function SortableHeader<T>({
  header,
  namespace,
}: {
  header: Header<T, unknown>
  namespace: string
}) {
  const { t } = useTranslation(namespace)
  const column = header.column
  const canReorder = column.columnDef.meta?.noReorder !== true
  const canSort = Boolean(column.columnDef.meta?.sortKey)
  const sorted = column.getIsSorted()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, disabled: !canReorder })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  // Priorité à la traduction fields.<id> si elle existe ; sinon header custom ; sinon id.
  const translated = t(`fields.${column.id}`, { defaultValue: "" })
  const label =
    translated ||
    (column.columnDef.header
      ? flexRender(column.columnDef.header, header.getContext())
      : column.id)

  const sortIcon =
    sorted === "asc"
      ? ArrowUp01Icon
      : sorted === "desc"
        ? ArrowDown01Icon
        : UnfoldMoreIcon

  return (
    <TableHead ref={setNodeRef} style={style} colSpan={header.colSpan}>
      <div className="flex items-center gap-1">
        {canReorder && (
          <button
            type="button"
            className="cursor-grab touch-none text-muted-foreground"
            aria-label={`reorder ${column.id}`}
            {...attributes}
            {...listeners}
          >
            <HugeiconsIcon icon={DragDropVerticalIcon} className="size-4" />
          </button>
        )}
        {canSort ? (
          <button
            type="button"
            className="flex items-center gap-1 font-medium"
            data-testid={`datatable-sort-${column.id}`}
            onClick={column.getToggleSortingHandler()}
          >
            {label}
            <HugeiconsIcon
              icon={sortIcon}
              className="size-3.5 text-muted-foreground"
            />
          </button>
        ) : (
          <span className="font-medium">{label}</span>
        )}
      </div>
    </TableHead>
  )
}

/**
 * Composant présentationnel server-driven. Reçoit l'instance de `useDataTable`
 * (+ flags react-query) et rend toolbar / table (DnD reorder, tri, visibilité)
 * / pagination avec états loading / empty / error.
 */
export function DataTable<T>({
  instance,
  data,
  meta,
  isLoading,
  isFetching,
  isError,
  onRowClick,
}: DataTableProps<T>) {
  const {
    namespace,
    columns,
    globalFilter,
    setGlobalFilter,
    columnOrder,
    setColumnOrder,
  } = instance
  const { t } = useTranslation("core")

  const table = useReactTable<T>({
    data,
    columns,
    state: {
      sorting: instance.sorting,
      columnFilters: instance.columnFilters,
      globalFilter: instance.globalFilter,
      columnVisibility: instance.columnVisibility,
      columnOrder: instance.columnOrder,
      pagination: instance.pagination,
    },
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
    enableMultiSort: false, // mono-tri UI
    pageCount: meta?.last_page ?? -1,
    rowCount: meta?.total,
    onSortingChange: instance.onSortingChange,
    onColumnFiltersChange: instance.onColumnFiltersChange,
    onGlobalFilterChange: instance.onGlobalFilterChange,
    onColumnVisibilityChange: instance.setColumnVisibility,
    onColumnOrderChange: instance.setColumnOrder,
    onPaginationChange: instance.setPagination,
    getCoreRowModel: getCoreRowModel(),
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setColumnOrder((prev) => {
      const from = prev.indexOf(String(active.id))
      const to = prev.indexOf(String(over.id))
      return from < 0 || to < 0 ? prev : arrayMove(prev, from, to)
    })
  }

  const colCount = table.getVisibleLeafColumns().length
  const rows = table.getRowModel().rows

  return (
    <div className="flex flex-col gap-3">
      <DataTableToolbar
        table={table}
        namespace={namespace}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />

      <div
        className={cn(
          "relative overflow-hidden rounded-xl border transition-opacity",
          isFetching && !isLoading && "opacity-60"
        )}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  <SortableContext
                    items={columnOrder}
                    strategy={horizontalListSortingStrategy}
                  >
                    {hg.headers.map((header) => (
                      <SortableHeader
                        key={header.id}
                        header={header}
                        namespace={namespace}
                      />
                    ))}
                  </SortableContext>
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, r) => (
                  <TableRow key={r}>
                    {Array.from({ length: colCount }).map((__, c) => (
                      <TableCell key={c}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell
                    colSpan={colCount}
                    className="py-10 text-center text-destructive"
                  >
                    {t("table.error")}
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={colCount}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {t("table.noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={
                      onRowClick ? () => onRowClick(row.original) : undefined
                    }
                    role={onRowClick ? "button" : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              onRowClick(row.original)
                            }
                          }
                        : undefined
                    }
                    className={onRowClick ? "cursor-pointer" : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <DataTablePagination table={table} />
    </div>
  )
}
