import { type PaginatedResponse, type TableQueries } from "@/modules/core"
import { FlexService } from "./flex.service"
import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query"

// Dé-wrappe le KyResponse en PaginatedResponse pour la DataTable (data + meta).
// keepPreviousData : anti-flash au changement de filtre/tri/page.
export const useFlexList = <T>(
  resource: string,
  query: TableQueries
): UseQueryResult<PaginatedResponse<T>, Error> => {
  const service = new FlexService(resource)
  return useQuery({
    queryKey: [resource, "list", query],
    queryFn: () => service.list<T>(query).then((r) => r.json()),
    placeholderData: keepPreviousData,
  })
}

// Dé-wrappe Resource<T> → T (le modèle), comme le détail consommé par Show.
export const useFlex = <T>(
  resource: string,
  id: string | number
): UseQueryResult<T, Error> => {
  return useQuery({
    queryKey: [resource, id],
    queryFn: () =>
      new FlexService(resource)
        .setIdentifier(id)
        .get<T>()
        .then((r) => r.json())
        .then((body) => body.data),
  })
}
