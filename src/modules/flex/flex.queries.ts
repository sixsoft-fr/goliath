import { type PaginatedResponse, type TableQueries } from "@/modules/core"
import type { KyResponse } from "ky"
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
  query: TableQueries,
): UseQueryResult<PaginatedResponse<T>, Error> => {
  const service = new FlexService(resource);
  return useQuery({
    queryKey: [resource, "list", query],
    queryFn: () => service.list<T>(query).then((r) => r.json()),
    placeholderData: keepPreviousData,
  })
}

export const useFlex = <T>(resource: string, id: string | number): UseQueryResult<KyResponse<T>, Error> => {
  const service = new FlexService(resource);
  return useQuery({
    queryKey: [resource, id],
    queryFn: () => service.setIdentifier(id).get<T>(),
  })
}
