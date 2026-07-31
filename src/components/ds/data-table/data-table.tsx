import { useTranslation } from "react-i18next"
import {
  flexRender,
  type Header,
  type Table as TableInstance,
} from "@tanstack/react-table"
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

export type DataTableProps<T> = DataTableInstance<T> & {
  isLoading?: boolean
  isFetching?: boolean
  isError?: boolean
}

// En-tête : poignée de drag (dnd-kit) + tri au clic (si sortKey) + libellé i18n.
function SortableHeader<T>({
  header,
  namespace,
}: {
  header: Header<T, unknown>
  namespace: string
}) {
  const { t } = useTranslation(["core", namespace])
  const column = header.column
  const canReorder = column.columnDef.meta?.noReorder !== true
  const canSort = Boolean(column.columnDef.meta?.sortKey)
  const sorted = column.getIsSorted()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: column.id, disabled: !canReorder })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  const label = column.columnDef.header
    ? flexRender(column.columnDef.header, header.getContext())
    : t(`fields.${column.id}`, { ns: namespace, defaultValue: column.id })

  const sortIcon =
    sorted === "asc" ? ArrowUp01Icon : sorted === "desc" ? ArrowDown01Icon : UnfoldMoreIcon

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
            onClick={column.getToggleSortingHandler()}
          >
            {label}
            <HugeiconsIcon icon={sortIcon} className="size-3.5 text-muted-foreground" />
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
export function DataTable<T>(props: DataTableProps<T>) {
  const {
    table,
    namespace,
    globalFilter,
    setGlobalFilter,
    columnOrder,
    setColumnOrder,
    isLoading,
    isFetching,
    isError,
  } = props
  const { t } = useTranslation(["core", namespace])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
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
          isFetching && !isLoading && "opacity-60",
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
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <DataTablePagination table={table} namespace={namespace} />
    </div>
  )
}

export type { TableInstance }
