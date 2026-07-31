import { useTranslation } from "react-i18next"
import { format } from "date-fns"
import type { ColumnDef } from "@tanstack/react-table"
import type { User } from "./users.types"

// User (auth) ne porte pas de `status` ; colonne démo via accessor élargi.
type UserRow = User & { status?: string }

const STATUS_OPTIONS = [
  { value: "active" },
  { value: "pending" },
  { value: "inactive" },
] as const

function StatusCell({ value }: { value?: string }) {
  const { t } = useTranslation("users")
  if (!value) return <span className="text-muted-foreground">—</span>
  return <span>{t(`values.status.${value}`, { defaultValue: value })}</span>
}

function formatDate(value: unknown): string {
  if (!value) return "—"
  const d = new Date(value as string)
  return Number.isNaN(d.getTime()) ? "—" : format(d, "dd/MM/yyyy")
}

/**
 * Colonnes de référence. Aucun `header` (le DataTable résout `users:fields.<id>`).
 * `sortKey`/`filter.key` = clés serveur whitelistées spatie (allowedSorts/Filters).
 */
export const usersColumns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    meta: { sortKey: "name", filter: { key: "name", type: "text" } },
  },
  {
    accessorKey: "email",
    meta: { sortKey: "email", filter: { key: "email", type: "text" } },
  },
  {
    id: "status",
    accessorFn: (row) => (row as UserRow).status,
    cell: ({ getValue }) => <StatusCell value={getValue<string | undefined>()} />,
    meta: {
      filter: {
        key: "status",
        type: "select",
        options: STATUS_OPTIONS.map((o) => ({ value: o.value })),
      },
    },
  },
  {
    id: "created_at",
    accessorFn: (row) => row.createdAt,
    cell: ({ getValue }) => formatDate(getValue()),
    meta: { sortKey: "created_at", filter: { key: "created_at", type: "dateRange" } },
  },
]
