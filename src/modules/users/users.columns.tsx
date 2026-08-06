import type { ColumnDef } from "@tanstack/react-table"
import { DateCell } from "@/components/ds/data-table/cells/date.cell"
import { StatusCell } from "@/components/ds/data-table/cells/status.cell"
import type { User } from "./users.types"

// User (auth) ne porte pas de `status` ; colonne démo via accessor élargi.
type UserRow = User & { current_status?: { name: string } }

const STATUS_OPTIONS = [
  { value: "active" },
  { value: "pending" },
  { value: "inactive" },
] as const

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
    accessorFn: (row) => (row as UserRow).current_status?.name ?? undefined,
    cell: ({ getValue }) => (
      <StatusCell value={getValue<string | undefined>()} ns="users" />
    ),
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
    accessorKey: "created_at",
    cell: ({ getValue }) => <DateCell value={getValue()} />,
    meta: {
      sortKey: "created_at",
      filter: { key: "created_at", type: "dateRange" },
    },
  },
]
