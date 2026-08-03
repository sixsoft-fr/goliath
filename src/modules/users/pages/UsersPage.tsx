import { useTranslation } from "react-i18next"
import { DataTable, useDataTable } from "@/components/ds/data-table"
import type { User } from "../users.types"
import { useUsers } from "../users.queries"
import { usersColumns } from "../users.columns"
import { useNavigate } from "react-router"
import { useSubject } from "@/modules/core"
import { useEffect } from "react"

export default function UsersPage() {
  const { t } = useTranslation("users")
  const navigate = useNavigate()
  const dt = useDataTable<User>({
    tableId: "users",
    namespace: "users",
    columns: usersColumns,
  })
  const query = useUsers(dt.queries)

  const { setResource } = useSubject()
  useEffect(() => {
    setResource("users")
  }, [setResource])

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <DataTable
        instance={dt}
        data={query.data?.data ?? []}
        meta={query.data?.meta}
        isLoading={query.isLoading}
        isFetching={query.isFetching}
        isError={query.isError}
        onRowClick={(element) => {
          navigate(`${element.uuid}`)
        }}
      />
    </div>
  )
}
