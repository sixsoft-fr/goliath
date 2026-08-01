import type { RowData } from "@tanstack/react-table"
import type { RangeFilter } from "@/modules/core/service/list.utils"

// Types de filtre supportés (pas d'enum — erasableSyntaxOnly).
export const FILTER_TYPES = ["text", "select", "boolean", "dateRange"] as const
export type FilterType = (typeof FILTER_TYPES)[number]

export type SelectOption = { value: string }

/**
 * Définition d'un filtre de colonne. `key` = clé serveur whitelistée spatie
 * (allowedFilters). Les libellés sont résolus via i18n, pas fournis ici.
 */
export type ColumnFilterDef =
  | { key: string; type: "text" }
  | { key: string; type: "select"; options: SelectOption[]; multiple?: boolean }
  | { key: string; type: "boolean" }
  | { key: string; type: "dateRange" }

// Valeur d'un filtre actif, selon son type.
export type FilterValue = string | boolean | string[] | RangeFilter

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Colonne triable : clé serveur whitelistée (allowedSorts). Absente → pas de tri. */
    sortKey?: string
    /** Colonne filtrable : définition + clé serveur whitelistée. Absente → pas de filtre. */
    filter?: ColumnFilterDef
    /** Exclure du drag reorder (ex : colonnes techniques). */
    noReorder?: boolean
    /** Colonne non-masquable. */
    noHide?: boolean
  }
}
