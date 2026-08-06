import { type FC, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { DataTable, useDataTable } from "@/components/ds/data-table"
import { useFlexList } from "@/modules/flex"
import { SubjectProvider, useSubject } from "@/modules/core"
import type { DynamicModel } from "@/modules/core"

interface ListProps {
  resource: string
}

const List: FC<ListProps> = ({ resource }: ListProps) => {
  const { t } = useTranslation(resource)
  const navigate = useNavigate()
  const dt = useDataTable<DynamicModel<unknown>>({
    tableId: resource,
    namespace: resource,
    columns: [], // should be deduced from list response meta.fields
  })
  const query = useFlexList<unknown>(resource, dt.queries)

  /**
   * Set the resource in the subject
   * so that the list elements can use it to navigate to the detail page
   */
  const { setResource } = useSubject()
  useEffect(() => {
    setResource(resource)
  }, [resource])

  return (
    <SubjectProvider>
      <div className="flex flex-col gap-4 p-4">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <DataTable<DynamicModel<unknown>>
          instance={dt}
          data={(query.data?.data as DynamicModel<unknown>[]) ?? []}
          meta={query.data?.meta}
          isLoading={query.isLoading}
          isFetching={query.isFetching}
          isError={query.isError}
          onRowClick={(element) => {
            navigate(
              `app/${resource}/${element && element.uuid ? element.uuid : ""}`
            )
          }}
        />
      </div>
    </SubjectProvider>
  )
}

export default List
