import { useTranslation } from "react-i18next"
import type { Table } from "@tanstack/react-table"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const PAGE_SIZES = [10, 25, 50, 100]

export function DataTablePagination<T>({
  table,
  namespace,
}: {
  table: Table<T>
  namespace: string
}) {
  const { t } = useTranslation(["core", namespace])
  const { pageIndex, pageSize } = table.getState().pagination
  const pageCount = Math.max(table.getPageCount(), 1)
  const total = table.getRowCount()

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">
        {t("table.total", { count: total })}
      </span>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{t("table.rowsPerPage")}</span>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="w-16">
                  {pageSize}
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={String(pageSize)}
                onValueChange={(v) => table.setPageSize(Number(v))}
              >
                {PAGE_SIZES.map((n) => (
                  <DropdownMenuRadioItem key={n} value={String(n)}>
                    {n}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <span className="text-muted-foreground">
          {t("table.page", { page: pageIndex + 1, total: pageCount })}
        </span>

        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label={t("table.previous")}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label={t("table.next")}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
