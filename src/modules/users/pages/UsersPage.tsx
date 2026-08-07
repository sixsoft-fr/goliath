import { useTranslation } from "react-i18next"
import { DataTable, useDataTable } from "@/components/ds/data-table"
import type { User } from "../users.types"
import { useUsers } from "../users.queries"
import { usersColumns } from "../users.columns"
import { useNavigate } from "react-router"
import { useSubject } from "@/modules/core"
import { useEffect, useState } from "react"
import { ConfirmDeleteModal } from "@/components/ds/resources/delete/ConfirmDeleteModal"

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

  /**
   * Delete Concern
   */
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteIdentifier, setDeleteIdentifier] = useState<string | null>(null);

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
        rowActions={{
          isViewable: true,
          isEditable: true,
          isDeletable: true,
          isPlayable: true,
          isRerunnable: true,
          onEdit: (row) => {
            navigate(`${row.uuid}/edit`)
          },
          onDelete: (row) => {
            setDeleteIdentifier(row.uuid);
            setIsDeleteModalOpen(true);
          }
        }}
      />
      <ConfirmDeleteModal
        resource="users"
        isOpen={isDeleteModalOpen}
        identifier={deleteIdentifier ?? ""}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={() => {}}
      />
    </div>
  )
}
