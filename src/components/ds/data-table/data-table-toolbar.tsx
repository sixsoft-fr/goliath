import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import type { Table } from "@tanstack/react-table"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  ColumnInsertIcon,
  FilterHorizontalIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableFilter } from "./data-table-filter"
import { useDebouncedValue } from "./use-debounced-value"

type ToolbarProps<T> = {
  table: Table<T>
  namespace: string
  globalFilter: string
  setGlobalFilter: (value: string) => void
}

export function DataTableToolbar<T>({
  table,
  namespace,
  globalFilter,
  setGlobalFilter,
}: ToolbarProps<T>) {
  const { t } = useTranslation(["core", namespace])

  const [search, setSearch] = useState(globalFilter)
  const debounced = useDebouncedValue(search, 250)
  useEffect(() => {
    setGlobalFilter(debounced)
    // setGlobalFilter est stable (setState wrap)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  // Incrémenté au "clear" → remonte les contrôles pour reset leur état local.
  const [epoch, setEpoch] = useState(0)

  const filterColumns = table
    .getAllColumns()
    .filter((c) => c.columnDef.meta?.filter)
  const hideableColumns = table
    .getAllColumns()
    .filter((c) => c.getCanHide() && c.columnDef.meta?.noHide !== true)

  const hasActive =
    table.getState().columnFilters.length > 0 || Boolean(globalFilter)

  const clearAll = () => {
    table.resetColumnFilters()
    setSearch("")
    setGlobalFilter("")
    setEpoch((e) => e + 1)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("table.search")}
        aria-label={t("table.search")}
        className="max-w-xs"
      />

      {filterColumns.length > 0 && (
        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" size="sm" className="gap-2">
                <HugeiconsIcon icon={FilterHorizontalIcon} className="size-4" />
                {t("table.filters")}
              </Button>
            }
          />
          <PopoverContent align="start" className="flex w-72 flex-col gap-3">
            <div key={epoch} className="flex flex-col gap-3">
              {filterColumns.map((c) => (
                <DataTableFilter key={c.id} column={c} namespace={namespace} />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {hasActive && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1">
          <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
          {t("table.clearFilters")}
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" className="ml-auto gap-2">
              <HugeiconsIcon icon={ColumnInsertIcon} className="size-4" />
              {t("table.columns")}
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          {hideableColumns.map((c) => (
            <DropdownMenuCheckboxItem
              key={c.id}
              checked={c.getIsVisible()}
              onCheckedChange={(v) => c.toggleVisibility(Boolean(v))}
              onSelect={(e) => e.preventDefault()}
            >
              {t(`fields.${c.id}`, { ns: namespace, defaultValue: c.id })}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
