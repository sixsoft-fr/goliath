import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import type { Column } from "@tanstack/react-table"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar03Icon } from "@hugeicons/core-free-icons"
import { format, parseISO } from "date-fns"
import type { DateRange } from "react-day-picker"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { RangeFilter } from "@/modules/core/service/list.utils"
import { useDebouncedValue } from "./use-debounced-value"
import type { ColumnFilterDef } from "./types"

type Ctx<T> = {
  column: Column<T, unknown>
  label: string
  namespace: string
}

// Texte : contains, debouncé 250 ms (live).
function TextFilter<T>({ column, label }: Ctx<T>) {
  const [local, setLocal] = useState((column.getFilterValue() as string) ?? "")
  const debounced = useDebouncedValue(local, 250)

  useEffect(() => {
    column.setFilterValue(debounced || undefined)
    // column est stable pour la durée de vie de la table
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={label}
        aria-label={label}
      />
    </label>
  )
}

// Select single/multi : valeurs jointes par virgule côté serveur (spatie array).
function SelectFilter<T>({
  column,
  label,
  namespace,
  def,
}: Ctx<T> & { def: Extract<ColumnFilterDef, { type: "select" }> }) {
  const { t } = useTranslation("core")
  const { t: tf } = useTranslation(namespace)
  const multiple = def.multiple ?? true
  const current = column.getFilterValue()
  const selected: string[] = multiple
    ? ((current as string[] | undefined) ?? [])
    : current != null
      ? [current as string]
      : []

  const optionLabel = (v: string) =>
    tf(`values.${def.key}.${v}`, { defaultValue: v })

  const toggle = (v: string) => {
    if (multiple) {
      const next = selected.includes(v)
        ? selected.filter((x) => x !== v)
        : [...selected, v]
      column.setFilterValue(next.length ? next : undefined)
    } else {
      column.setFilterValue(selected.includes(v) ? undefined : v)
    }
  }

  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" className="justify-start">
              {selected.length
                ? selected.map(optionLabel).join(", ")
                : t("table.all")}
            </Button>
          }
        />
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          {def.options.map((o) => (
            <DropdownMenuCheckboxItem
              key={o.value}
              checked={selected.includes(o.value)}
              onCheckedChange={() => toggle(o.value)}
              onSelect={(e) => e.preventDefault()}
            >
              {optionLabel(o.value)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Booléen : Tous / Oui / Non → undefined / true / false.
function BooleanFilter<T>({ column, label }: Ctx<T>) {
  const { t } = useTranslation("core")
  const value = column.getFilterValue() as boolean | undefined
  const current = value === undefined ? "all" : value ? "true" : "false"

  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" className="justify-start">
              {current === "all"
                ? t("table.all")
                : current === "true"
                  ? t("table.yes")
                  : t("table.no")}
            </Button>
          }
        />
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup
            value={current}
            onValueChange={(v) =>
              column.setFilterValue(v === "all" ? undefined : v === "true")
            }
          >
            <DropdownMenuRadioItem value="all">{t("table.all")}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="true">{t("table.yes")}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="false">{t("table.no")}</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Date-range : opérateurs dynamiques spatie via RangeFilter { gte, lte }.
function DateRangeFilter<T>({ column, label }: Ctx<T>) {
  const value = column.getFilterValue() as RangeFilter | undefined
  const selected: DateRange | undefined = value
    ? {
        from: value.gte ? parseISO(String(value.gte)) : undefined,
        to: value.lte ? parseISO(String(value.lte)) : undefined,
      }
    : undefined

  const onSelect = (range: DateRange | undefined) => {
    if (!range || (!range.from && !range.to)) {
      column.setFilterValue(undefined)
      return
    }
    const next: RangeFilter = {}
    if (range.from) next.gte = format(range.from, "yyyy-MM-dd")
    if (range.to) next.lte = format(range.to, "yyyy-MM-dd")
    column.setFilterValue(next)
  }

  const btnLabel =
    value?.gte || value?.lte
      ? [value?.gte, value?.lte].filter(Boolean).join(" → ")
      : label

  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" size="sm" className="justify-start gap-2">
              <HugeiconsIcon icon={Calendar03Icon} className="size-4" />
              {btnLabel}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={selected}
            onSelect={onSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

/** Contrôle de filtre pour une colonne, choisi selon `meta.filter.type`. */
export function DataTableFilter<T>({
  column,
  namespace,
}: {
  column: Column<T, unknown>
  namespace: string
}) {
  const { t: tf } = useTranslation(namespace)
  const def = column.columnDef.meta?.filter
  if (!def) return null

  const label = tf(`fields.${column.id}`, { defaultValue: column.id })
  const ctx: Ctx<T> = { column, label, namespace }

  switch (def.type) {
    case "text":
      return <TextFilter {...ctx} />
    case "select":
      return <SelectFilter {...ctx} def={def} />
    case "boolean":
      return <BooleanFilter {...ctx} />
    case "dateRange":
      return <DateRangeFilter {...ctx} />
  }
}
